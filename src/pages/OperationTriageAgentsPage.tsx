import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Settings2,
  TestTube2,
  Trash2,
} from "lucide-react";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import {
  useOperationalTriageAgentMutations,
  useOperationalTriageAgents,
} from "@/hooks/useOperationalTriageAgents";
import { usePermissions } from "@/hooks/usePermissions";
import {
  OperationalTriageAgent,
  CreateOperationalTriageAgentBody,
  UpdateOperationalTriageAgentBody,
} from "@/types/operation-triage-agent";
import {
  getOperationalTriageAgentErrorMessage,
  isOperationalTriageAgentStaleVersion,
} from "@/utils/operationalTriageAgentErrors";
import {
  OperationalTriageAgentDialog,
  OperationalTriageAgentFormValues,
} from "@/components/operation/OperationalTriageAgentDialog";
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { formatOperationalDateTime } from "@/components/operation/operationalChannelLabels";

export default function OperationTriageAgentsPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] =
    useState<OperationalTriageAgent | null>(null);
  const [agentToDeactivate, setAgentToDeactivate] =
    useState<OperationalTriageAgent | null>(null);

  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canManage = has("manage:operation-setup");
  const agentsQuery = useOperationalTriageAgents(workspaceId, canManage);
  const mutations = useOperationalTriageAgentMutations(workspaceId);

  const openCreateDialog = () => {
    setEditingAgent(null);
    setDialogOpen(true);
  };

  const openEditDialog = (agent: OperationalTriageAgent) => {
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingAgent(null);
  };

  const handleSubmit = async (values: OperationalTriageAgentFormValues) => {
    if (!workspaceId) return;

    try {
      if (editingAgent) {
        const body: UpdateOperationalTriageAgentBody = {
          name: values.name.trim(),
          enabled: values.enabled,
          baseUrl: values.baseUrl.trim(),
          timeoutMs: values.timeoutMs,
          maxAttempts: values.maxAttempts,
          expectedVersion: editingAgent.version,
          ...(values.credential.trim()
            ? { credential: values.credential.trim() }
            : {}),
        };
        await mutations.update.mutateAsync({
          agentId: editingAgent.id,
          body,
        });
        toast({
          title: "Agente atualizado",
          description: "A configuração do agente foi atualizada com segurança.",
        });
      } else {
        const body: CreateOperationalTriageAgentBody = {
          name: values.name.trim(),
          adapter: "GENERIC_HTTP",
          enabled: values.enabled,
          baseUrl: values.baseUrl.trim(),
          credential: values.credential.trim(),
          timeoutMs: values.timeoutMs,
          maxAttempts: values.maxAttempts,
        };
        await mutations.create.mutateAsync(body);
        toast({
          title: "Agente criado",
          description: "O agente já pode ser selecionado em uma rota externa.",
        });
      }

      closeDialog(false);
    } catch (error) {
      toast({
        title: "Não foi possível salvar o agente",
        description: getOperationalTriageAgentErrorMessage(
          error,
          "Verifique os dados e tente novamente.",
        ),
        action: isOperationalTriageAgentStaleVersion(error) ? (
          <ToastAction
            altText="Recarregar agentes"
            onClick={() => void agentsQuery.refetch()}
          >
            Recarregar
          </ToastAction>
        ) : undefined,
        variant: "destructive",
      });
    }
  };

  const handleTest = async (agent: OperationalTriageAgent) => {
    try {
      const result = await mutations.test.mutateAsync({ agentId: agent.id });
      toast({
        title: "Conexão aprovada",
        description: `O teste de conexão respondeu ${result.status} em ${result.latencyMs} ms.`,
      });
    } catch (error) {
      toast({
        title: "Falha no teste de conexão",
        description: getOperationalTriageAgentErrorMessage(
          error,
          "O serviço remoto não respondeu conforme esperado.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    if (!agentToDeactivate) return;

    try {
      await mutations.remove.mutateAsync({
        agentId: agentToDeactivate.id,
        expectedVersion: agentToDeactivate.version,
      });
      toast({
        title: "Agente desativado",
        description: "O histórico foi preservado e ele saiu das rotas disponíveis.",
      });
      setAgentToDeactivate(null);
    } catch (error) {
      toast({
        title: "Não foi possível desativar o agente",
        description: getOperationalTriageAgentErrorMessage(
          error,
          "Desative as rotas dependentes e tente novamente.",
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
            Selecione um ambiente operacional para administrar agentes de triagem.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/operation"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "-ml-3 mb-2",
            })}
          >
            <ArrowLeft className="h-4 w-4" />
            Configuração operacional
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Administração operacional
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Agentes de triagem
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cadastre serviços externos, valide a conexão e vincule cada agente
            a uma rota de agente externo dos canais operacionais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {has("manage:operation-channels") ? (
            <Link
              to="/operation/channels"
              className={buttonVariants({ variant: "outline" })}
            >
              <Radio className="h-4 w-4" />
              Vincular em canal
            </Link>
          ) : null}
          <Button onClick={openCreateDialog} disabled={!canManage}>
            <Plus className="h-4 w-4" />
            Novo agente
          </Button>
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
          O segredo é somente para gravação (não pode ser lido depois). A API valida a empresa, o host permitido e a
          versão do registro antes de persistir qualquer alteração.
        </AlertDescription>
      </Alert>

      {agentsQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando agentes de triagem</span>
          </CardContent>
        </Card>
      ) : agentsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os agentes</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {getOperationalTriageAgentErrorMessage(
              agentsQuery.error,
              "Verifique sua permissão e tente novamente.",
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => void agentsQuery.refetch()}
              disabled={agentsQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Agentes deste ambiente</CardTitle>
            <CardDescription>
              Somente agentes ativos aparecem como destino de novas rotas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agentsQuery.data?.items.length ? (
              <div className="space-y-3">
                {agentsQuery.data.items.map((agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    isTesting={mutations.test.isPending}
                    canEdit={canManage}
                    onEdit={openEditDialog}
                    onTest={(item) => void handleTest(item)}
                    onDeactivate={setAgentToDeactivate}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Bot className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">Nenhum agente de triagem</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cadastre o primeiro serviço para habilitar rotas externas.
                </p>
                <Button className="mt-4" onClick={openCreateDialog} disabled={!canManage}>
                  <Plus className="h-4 w-4" />
                  Criar agente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <OperationalTriageAgentDialog
        open={dialogOpen}
        agent={editingAgent}
        isPending={mutations.create.isPending || mutations.update.isPending}
        onOpenChange={closeDialog}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(agentToDeactivate)}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setAgentToDeactivate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar agente?</AlertDialogTitle>
            <AlertDialogDescription>
              O agente “{agentToDeactivate?.name}” não poderá ser usado em novas
              rotas. O histórico de execuções será preservado.
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

function AgentRow({
  agent,
  isTesting,
  canEdit,
  onEdit,
  onTest,
  onDeactivate,
}: {
  agent: OperationalTriageAgent;
  isTesting: boolean;
  canEdit: boolean;
  onEdit: (agent: OperationalTriageAgent) => void;
  onTest: (agent: OperationalTriageAgent) => void;
  onDeactivate: (agent: OperationalTriageAgent) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <p className="font-medium">{agent.name}</p>
          <Badge variant={agent.enabled ? "secondary" : "outline"}>
            {agent.enabled ? "Ativo" : "Desativado"}
          </Badge>
          {agent.credentialConfigured ? (
            <Badge variant="outline">
              <KeyRound className="mr-1 h-3 w-3" />
              Credencial configurada
            </Badge>
          ) : (
            <Badge variant="outline">Sem credencial</Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">{agent.baseUrl}</p>
        <p className="text-xs text-muted-foreground">
          Tempo limite: {agent.timeoutMs} ms · {agent.maxAttempts} tentativa(s) · versão {agent.version}
          {agent.updatedAt ? ` · atualizado em ${formatOperationalDateTime(agent.updatedAt)}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onTest(agent)}
          disabled={!canEdit || isTesting}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TestTube2 className="h-4 w-4" />
          )}
          Testar conexão
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(agent)} disabled={!canEdit}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => onDeactivate(agent)}
          disabled={!canEdit || !agent.enabled}
        >
          <Trash2 className="h-4 w-4" />
          Desativar
        </Button>
      </div>
    </div>
  );
}
