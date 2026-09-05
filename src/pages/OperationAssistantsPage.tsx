import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Settings2,
  Trash2,
  XCircle,
} from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  useOperationalAssistantMutations,
  useOperationalAssistants,
} from "@/hooks/useOperationalAssistants";
import { usePermissions } from "@/hooks/usePermissions";
import { listContent } from "@/services/content/listContent";
import { listIaModels } from "@/services/iaModel/listIaModel";
import {
  OperationalAssistantContextWindowTurns,
  OperationalAssistantSummary,
  OperationalAssistantUpdateBody,
  OperationalAssistantCreateBody,
} from "@/types/operation-assistant";
import { Content } from "@/types/content";
import { IaModel } from "@/types/iaModel";
import {
  getOperationalAssistantErrorMessage,
  isOperationalAssistantStaleVersion,
} from "@/utils/operationalAssistantErrors";
import { OperationalAssistantDialog, OperationalAssistantFormValues } from "@/components/operation/OperationalAssistantDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export default function OperationAssistantsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] =
    useState<OperationalAssistantSummary | null>(null);
  const [assistantToDeactivate, setAssistantToDeactivate] =
    useState<OperationalAssistantSummary | null>(null);

  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canViewAssistants = has("view:assistant");
  const canManageAssistants = has("update:assistant");
  const canCreateAssistant = has("create:assistant");
  const canDeleteAssistant = has("delete:assistant");
  const canManageChannels = has("manage:operation-channels");
  const assistantsQuery = useOperationalAssistants(
    workspaceId,
    canViewAssistants,
  );
  const mutations = useOperationalAssistantMutations(workspaceId);

  const modelsQuery = useQuery({
    queryKey: ["operation-assistant-models"],
    queryFn: listIaModels,
    enabled: Boolean(dialogOpen && canViewAssistants),
  });
  const contentsQuery = useQuery({
    queryKey: ["operation-assistant-contents", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Ambiente operacional não selecionado");
      }

      return listContent(workspaceId);
    },
    enabled: Boolean(dialogOpen && workspaceId && canViewAssistants),
  });

  const openCreateDialog = () => {
    setEditingAssistant(null);
    setDialogOpen(true);
  };

  const openEditDialog = (assistant: OperationalAssistantSummary) => {
    setEditingAssistant(assistant);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingAssistant(null);
  };

  const handleAssistantSubmit = async (
    values: OperationalAssistantFormValues,
  ) => {
    if (!workspaceId) return;

    const commonBody = {
      name: values.name.trim(),
      description: values.description.trim(),
      avatarFileId: null,
      timeZone: values.timeZone,
      language: values.language,
      iaModelId: values.iaModelId,
      prompt: {
        function: values.function.trim(),
        style: values.style.trim(),
        instructions: values.instructions.trim(),
        blacklist: values.blacklist.trim() || null,
        links: values.links.length
          ? values.links.map((link) => ({
              name: link.name.trim(),
              url: link.url.trim(),
            }))
          : null,
      },
      contentIds: values.contentIds,
      audioTranscriptionEnabled: values.audioTranscriptionEnabled,
      contextWindowTurns: Number(
        values.contextWindowTurns,
      ) as OperationalAssistantContextWindowTurns,
      claudeResponseProfile: values.claudeResponseProfile,
    };

    try {
      if (editingAssistant) {
        const body: OperationalAssistantUpdateBody = {
          ...commonBody,
          ...(values.providerCredential.trim()
            ? { providerCredential: values.providerCredential.trim() }
            : {}),
          ...(values.openAiTranscriptionCredential.trim()
            ? {
                openAiTranscriptionCredential:
                  values.openAiTranscriptionCredential.trim(),
              }
            : {}),
        };
        await mutations.update.mutateAsync({
          assistantId: editingAssistant.id,
          body,
        });
        toast({
          title: "Assistente de atendimento atualizado",
          description: "A configuração operacional foi atualizada.",
        });
      } else {
        const body: OperationalAssistantCreateBody = {
          ...commonBody,
          providerCredential: values.providerCredential.trim(),
          ...(values.openAiTranscriptionCredential.trim()
            ? {
                openAiTranscriptionCredential:
                  values.openAiTranscriptionCredential.trim(),
              }
            : {}),
        };
        await mutations.create.mutateAsync({ body });
        toast({
        title: "Assistente de atendimento criado",
        description: "O assistente já pode ser selecionado em uma rota operacional.",
        });
      }

      closeDialog(false);
    } catch (error) {
      toast({
        title: "Não foi possível salvar o assistente",
        description: getOperationalAssistantErrorMessage(
          error,
          "Verifique os dados e tente novamente.",
        ),
        action: isOperationalAssistantStaleVersion(error) ? (
          <ToastAction
            altText="Recarregar assistentes"
            onClick={() => void assistantsQuery.refetch()}
          >
            Recarregar
          </ToastAction>
        ) : undefined,
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    if (!assistantToDeactivate) return;

    try {
      await mutations.remove.mutateAsync({
        assistantId: assistantToDeactivate.id,
      });
      toast({
        title: "Assistente de atendimento desativado",
        description: "O histórico foi preservado e ele saiu das opções ativas.",
      });
      setAssistantToDeactivate(null);
    } catch (error) {
      toast({
        title: "Não foi possível desativar o assistente",
        description: getOperationalAssistantErrorMessage(
          error,
          "O assistente pode estar vinculado a uma rota ou atendimento aberto.",
        ),
        variant: "destructive",
      });
    }
  };

  if (currentWorkspace?.type !== "OPERATION") {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Seção disponível apenas em ambientes operacionais</AlertTitle>
          <AlertDescription>
            Selecione um ambiente operacional para administrar assistentes de atendimento.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const operationalWorkspaceId = currentWorkspace.id;
  const optionsLoading = modelsQuery.isLoading || contentsQuery.isLoading;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/operation/agents"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3 mb-2" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Agentes
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Administração operacional
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Assistentes de atendimento
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure os assistentes nativos deste ambiente e escolha quais podem
            receber uma rota de entrada.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageChannels ? (
            <Link
              to="/operation/channels"
              className={buttonVariants({ variant: "outline" })}
            >
              <Radio className="h-4 w-4" />
              Vincular em canais
            </Link>
          ) : null}
          {canCreateAssistant ? (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Novo assistente de atendimento
            </Button>
          ) : null}
          <Badge variant="outline" className="h-10 gap-2 px-3">
            <Settings2 className="h-4 w-4" />
            {currentWorkspace.name}
          </Badge>
        </div>
      </header>

      <Alert>
        <KeyRound className="h-4 w-4" />
        <AlertTitle>Credenciais protegidas</AlertTitle>
        <AlertDescription>
          As chaves dos serviços de IA e de transcrição são somente para gravação
          e nunca podem ser lidas depois. O sistema valida o ambiente, a
          permissão e as referências antes de salvar qualquer alteração.
        </AlertDescription>
      </Alert>

      {assistantsQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando assistentes de atendimento</span>
          </CardContent>
        </Card>
      ) : assistantsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os assistentes</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {getOperationalAssistantErrorMessage(
              assistantsQuery.error,
              "Verifique sua permissão e tente novamente.",
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => void assistantsQuery.refetch()}
              disabled={assistantsQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Assistentes de atendimento deste ambiente</CardTitle>
            <CardDescription>
              Somente assistentes ativos aparecem como destino de novas rotas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assistantsQuery.data?.items.length ? (
              <div className="space-y-3">
                {assistantsQuery.data.items.map((assistant) => (
                  <AssistantRow
                    key={assistant.id}
                    assistant={assistant}
                    canEdit={canManageAssistants}
                    canDelete={canDeleteAssistant}
                    onEdit={openEditDialog}
                    onDeactivate={setAssistantToDeactivate}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Bot className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">Nenhum assistente de atendimento</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {canCreateAssistant
                    ? "Crie o primeiro assistente para habilitar rotas com IA."
                    : "Um administrador da empresa ainda não configurou um assistente."}
                </p>
                {canCreateAssistant ? (
                  <Button className="mt-4" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4" />
                    Criar assistente de atendimento
                  </Button>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <OperationalAssistantDialog
        open={dialogOpen}
        workspaceId={operationalWorkspaceId}
        assistant={editingAssistant}
        models={modelsQuery.data?.iaModels ?? []}
        contents={contentsQuery.data?.contents ?? []}
        optionsLoading={optionsLoading}
        modelsError={modelsQuery.error}
        contentsError={contentsQuery.error}
        isPending={mutations.create.isPending || mutations.update.isPending}
        onRetryOptions={() => {
          void modelsQuery.refetch();
          void contentsQuery.refetch();
        }}
        onOpenChange={closeDialog}
        onSubmit={handleAssistantSubmit}
      />

      <AlertDialog
        open={Boolean(assistantToDeactivate)}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) {
            setAssistantToDeactivate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar assistente de atendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              O assistente “{assistantToDeactivate?.name}” ficará fora das novas
              opções. A API bloqueia a ação se ainda houver rota ativa ou
              atendimento aberto vinculado a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutations.remove.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeactivate();
              }}
              disabled={mutations.remove.isPending}
            >
              {mutations.remove.isPending ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function AssistantRow({
  assistant,
  canEdit,
  canDelete,
  onEdit,
  onDeactivate,
}: {
  assistant: OperationalAssistantSummary;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (assistant: OperationalAssistantSummary) => void;
  onDeactivate: (assistant: OperationalAssistantSummary) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-11 w-11">
          {assistant.avatarUrl ? <AvatarImage src={assistant.avatarUrl} alt="" /> : null}
          <AvatarFallback>{getInitials(assistant.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{assistant.name}</p>
            <Badge variant={assistant.active ? "secondary" : "outline"}>
              {assistant.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {assistant.providerCredentialConfigured ? (
              <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Serviço de IA configurado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                <XCircle className="h-3.5 w-3.5" />
                Serviço de IA pendente
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {canEdit ? (
          <Button size="sm" variant="outline" onClick={() => onEdit(assistant)}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : null}
        {canDelete && assistant.active ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onDeactivate(assistant)}
          >
            <Trash2 className="h-4 w-4" />
            Desativar
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
