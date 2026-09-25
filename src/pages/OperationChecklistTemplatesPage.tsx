import { useState } from "react";
import { AxiosError } from "axios";
import {
  AlertCircle,
  ClipboardCheck,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useOperationalChecklistTemplateMutations,
  useOperationalChecklistTemplates,
} from "@/hooks/useOperationalChecklistTemplates";
import {
  useOperationalChecklistPreference,
  useOperationalChecklistPreferenceMutations,
} from "@/hooks/useOperationalChecklistPreference";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { OperationalChecklistTemplateCard } from "@/components/operation/OperationalChecklistTemplateCard";
import {
  OperationalChecklistTemplateFormDialog,
  OperationalChecklistTemplateFormValues,
} from "@/components/operation/OperationalChecklistTemplateFormDialog";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationalChecklistTemplate } from "@/types/operational-checklist";

export default function OperationChecklistTemplatesPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { toast } = useToast();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canManageOfficial = has("manage:operation-checklists");
  const canOperateAttendances = has("operate:operation-attendances");
  const isOperator = canOperateAttendances && !canManageOfficial;
  const canCreate =
    Boolean(workspaceId) && (canManageOfficial || canOperateAttendances);

  const templatesQuery = useOperationalChecklistTemplates(workspaceId);
  const mutations = useOperationalChecklistTemplateMutations(workspaceId);
  const preferenceQuery = useOperationalChecklistPreference(
    workspaceId,
    isOperator,
  );
  const preferenceMutations =
    useOperationalChecklistPreferenceMutations(workspaceId);
  const [editingTemplate, setEditingTemplate] =
    useState<OperationalChecklistTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] =
    useState<OperationalChecklistTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const openCreate = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const openEdit = (template: OperationalChecklistTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleSubmit = async (values: OperationalChecklistTemplateFormValues) => {
    const items = values.items.map((item) => ({
      ...item,
      required: true,
    }));

    try {
      if (editingTemplate) {
        await mutations.update.mutateAsync({
          templateId: editingTemplate.id,
          name: values.name,
          items,
          expectedVersion: editingTemplate.version,
        });
        toast({
          title: "Modelo atualizado",
          description: "As etapas do modelo foram atualizadas.",
        });
      } else {
        await mutations.create.mutateAsync({
          name: values.name,
          items,
        });
        toast({
          title: canManageOfficial
            ? "Modelo oficial criado"
            : "Modelo pessoal criado",
          description: canManageOfficial
            ? "O modelo já fica disponível para toda a equipe autorizada."
            : "O modelo ficará disponível somente para você.",
        });
      }

      setIsFormOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      toast({
        title: "Não foi possível salvar o modelo",
        description: getApiErrorMessage(
          error,
          "Verifique os dados e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      await mutations.remove.mutateAsync({
        templateId: templateToDelete.id,
        expectedVersion: templateToDelete.version,
      });
      toast({
        title: "Modelo apagado",
        description:
          "Ele foi removido da biblioteca. Checklists já aplicadas continuam preservadas.",
      });
      setTemplateToDelete(null);
    } catch (error) {
      toast({
        title: "Não foi possível apagar o modelo",
        description: getApiErrorMessage(
          error,
          "O modelo pode ter sido alterado por outra pessoa.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDefaultChange = async (templateId: string) => {
    try {
      await preferenceMutations.set.mutateAsync({ templateId });
      toast({
        title: "Checklist padrão atualizado",
        description:
          "Ele será aplicado quando um atendimento for atribuído a você, se ainda não houver checklist.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível salvar o padrão",
        description: getApiErrorMessage(
          error,
          "Escolha um modelo ativo e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleClearDefault = async () => {
    try {
      await preferenceMutations.clear.mutateAsync();
      toast({
        title: "Aplicação automática desativada",
        description:
          "Nenhum checklist será aplicado automaticamente nas próximas atribuições.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível desativar o padrão",
        description: getApiErrorMessage(
          error,
          "Tente novamente em instantes.",
        ),
        variant: "destructive",
      });
    }
  };

  const templates = templatesQuery.data ?? [];
  const activeTemplates = templates.filter((template) => template.active);
  const activeOfficialTemplates = activeTemplates.filter(
    (template) => template.visibility === "OFFICIAL",
  );
  const activePersonalTemplates = activeTemplates.filter(
    (template) => template.visibility === "PERSONAL",
  );
  const currentDefault = activeTemplates.find(
    (template) => template.id === preferenceQuery.data?.templateId,
  );
  const hasUnavailableDefault =
    preferenceQuery.isSuccess &&
    Boolean(preferenceQuery.data) &&
    templatesQuery.isSuccess &&
    !currentDefault;
  const isSavingPreference =
    preferenceMutations.set.isPending || preferenceMutations.clear.isPending;
  const officialTemplates = templates.filter(
    (template) => template.visibility === "OFFICIAL",
  );
  const personalTemplates = templates.filter(
    (template) => template.visibility === "PERSONAL",
  );
  const shouldShowPersonal =
    isOperator || personalTemplates.length > 0;
  const isSaving = mutations.create.isPending || mutations.update.isPending;
  const pageDescription = canManageOfficial
    ? "Defina os modelos oficiais que padronizam as etapas dos atendimentos da equipe."
    : canOperateAttendances
      ? "Consulte os modelos da equipe e organize suas próprias etapas recorrentes."
      : "Consulte os modelos oficiais da equipe para seguir o padrão nos atendimentos.";
  const createButtonLabel = canManageOfficial
    ? "Criar modelo oficial"
    : "Criar modelo pessoal";
  const templateSections: TemplateSectionProps[] = [
    {
      sectionId: "official-templates",
      title: "Modelos oficiais",
      visibility: "OFFICIAL",
      description: canManageOfficial
        ? "Padrões da equipe que podem ser aplicados nos atendimentos."
        : "Modelos da equipe para consultar e aplicar nos atendimentos.",
      templates: officialTemplates,
      emptyTitle: canManageOfficial
        ? "Nenhum modelo oficial criado"
        : "Nenhum modelo oficial disponível",
      emptyMessage: canManageOfficial
        ? "Use “Criar modelo oficial” para definir o primeiro padrão da equipe."
        : "A gestão ainda não criou modelos oficiais para este workspace.",
      canEdit: canManageOfficial,
      isDeleting: mutations.remove.isPending,
      onEdit: openEdit,
      onDelete: setTemplateToDelete,
    },
    ...(shouldShowPersonal
      ? [
          {
            sectionId: "personal-templates",
            title: "Meus modelos pessoais",
            visibility: "PERSONAL" as const,
            description:
              canOperateAttendances
                ? "Privados para você: só você pode consultar e editar estes modelos."
                : "Privados para você: só você pode consultar estes modelos.",
            templates: personalTemplates,
            emptyTitle: "Você ainda não tem modelos pessoais",
            emptyMessage:
              canManageOfficial
                ? "Os modelos pessoais são seus e permanecem separados do padrão oficial da equipe."
                : "Use “Criar modelo pessoal” para organizar as etapas da sua rotina.",
            canEdit: canOperateAttendances,
            isDeleting: mutations.remove.isPending,
            onEdit: openEdit,
            onDelete: setTemplateToDelete,
          },
        ]
      : []),
  ];

  return (
    <section className="mx-auto w-full max-w-[1280px] space-y-6 pb-8">
      <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/operation"
          className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Operação
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Checklists</span>
      </nav>

      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            Modelos de checklist
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
            {pageDescription}
          </p>
        </div>
        {canCreate ? (
          <Button className="w-full shrink-0 sm:w-auto" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {createButtonLabel}
          </Button>
        ) : null}
      </header>

      {isOperator && workspaceId ? (
        <Card aria-labelledby="operator-checklist-default-title">
          <CardHeader className="space-y-1 p-4 pb-3 sm:p-5 sm:pb-3">
            <CardTitle
              id="operator-checklist-default-title"
              className="text-base"
            >
              Checklist padrão nas novas atribuições
            </CardTitle>
            <CardDescription className="max-w-3xl leading-5">
              A escolha é salva imediatamente e aplicada quando um atendimento
              for atribuído a você. Checklists e progresso já existentes são
              preservados.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:flex-row sm:items-center sm:p-5 sm:pt-0">
            <div className="min-w-0 flex-1">
              <Select
                value={currentDefault?.id ?? ""}
                onValueChange={(templateId) =>
                  void handleDefaultChange(templateId)
                }
                disabled={
                  preferenceQuery.isLoading ||
                  templatesQuery.isLoading ||
                  templatesQuery.isError ||
                  isSavingPreference ||
                  activeTemplates.length === 0
                }
              >
                <SelectTrigger
                  aria-label="Checklist padrão para novas atribuições"
                  className="w-full sm:max-w-md"
                >
                  <SelectValue
                    placeholder={
                      preferenceQuery.isLoading
                        ? "Carregando preferência..."
                        : "Selecione um checklist"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {activeOfficialTemplates.length ? (
                    <SelectGroup>
                      <SelectLabel>Modelos oficiais</SelectLabel>
                      {activeOfficialTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                  {activePersonalTemplates.length ? (
                    <SelectGroup>
                      <SelectLabel>Meus modelos pessoais</SelectLabel>
                      {activePersonalTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                </SelectContent>
              </Select>
              {isSavingPreference ? (
                <p role="status" className="mt-2 text-xs text-muted-foreground">
                  Salvando preferência…
                </p>
              ) : preferenceQuery.isLoading ? (
                <p role="status" className="mt-2 text-xs text-muted-foreground">
                  Carregando preferência…
                </p>
              ) : activeTemplates.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Não há modelos ativos para escolher.
                </p>
              ) : null}
            </div>
            {preferenceQuery.data ? (
              <Button
                type="button"
                variant="outline"
                className="w-full shrink-0 sm:w-auto"
                disabled={isSavingPreference || preferenceQuery.isLoading}
                onClick={() => void handleClearDefault()}
              >
                Desativar padrão
              </Button>
            ) : null}
          </CardContent>
          {preferenceQuery.isError ? (
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Não foi possível carregar sua preferência</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  Tente novamente para consultar o checklist padrão salvo.
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void preferenceQuery.refetch()}
                    disabled={preferenceQuery.isFetching}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : hasUnavailableDefault ? (
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>O modelo padrão não está mais disponível</AlertTitle>
                <AlertDescription>
                  Ele foi arquivado ou removido. Escolha outro modelo ativo ou
                  desative a aplicação automática.
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
        </Card>
      ) : null}

      {currentWorkspace?.type !== "OPERATION" ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Workspace operacional não selecionado</AlertTitle>
          <AlertDescription>
            Selecione um workspace de Operação no menu da barra lateral para
            consultar os modelos correspondentes.
          </AlertDescription>
        </Alert>
      ) : templatesQuery.isLoading ? (
        <div
          role="status"
          aria-label="Carregando modelos"
          className="space-y-10"
        >
          {templateSections.map((section) => (
            <div key={section.sectionId} className="space-y-4">
              <div className="space-y-2 border-b pb-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
              <Card className="border-border/70 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-9 w-24" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : templatesQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os modelos</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Tente novamente quando a API estiver disponível.
            <Button
              size="sm"
              variant="outline"
              onClick={() => templatesQuery.refetch()}
              disabled={templatesQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-10">
          {templateSections.map((section) => (
            <TemplateSection key={section.sectionId} {...section} />
          ))}
        </div>
      )}

      <OperationalChecklistTemplateFormDialog
        open={isFormOpen}
        template={editingTemplate}
        visibility={
          editingTemplate?.visibility ??
          (canManageOfficial ? "OFFICIAL" : "PERSONAL")
        }
        isPending={isSaving}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(templateToDelete)}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setTemplateToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo “{templateToDelete?.name}” será removido da biblioteca.
              Checklists já aplicadas continuarão preservadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutations.remove.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutations.remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {mutations.remove.isPending ? "Apagando..." : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

type TemplateSectionProps = {
  sectionId: string;
  title: string;
  visibility: OperationalChecklistTemplate["visibility"];
  description: string;
  templates: OperationalChecklistTemplate[];
  emptyTitle: string;
  emptyMessage: string;
  canEdit: boolean;
  isDeleting: boolean;
  onEdit: (template: OperationalChecklistTemplate) => void;
  onDelete: (template: OperationalChecklistTemplate) => void;
};

function TemplateSection({
  sectionId,
  title,
  visibility,
  description,
  templates,
  emptyTitle,
  emptyMessage,
  canEdit,
  isDeleting,
  onEdit,
  onDelete,
}: TemplateSectionProps) {
  const isOfficial = visibility === "OFFICIAL";
  const SectionIcon = isOfficial ? ClipboardCheck : UserRound;

  return (
    <section className="min-w-0 space-y-4" aria-labelledby={sectionId}>
      <header className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={
              isOfficial
                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            }
          >
            <SectionIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={sectionId} className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {templates.length} {templates.length === 1 ? "modelo" : "modelos"}
        </span>
      </header>

      {templates.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <OperationalChecklistTemplateCard
              key={template.id}
              template={template}
              canEdit={canEdit}
              isDeleting={isDeleting}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-28 items-start gap-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-5">
          <span
            className={
              isOfficial
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground"
            }
          >
            <SectionIcon className="h-4 w-4" />
          </span>
          <div className="pt-0.5">
            <p className="text-sm font-semibold">{emptyTitle}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {emptyMessage}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof AxiosError)) return fallback;

  const code = error.response?.data?.message;
  const messages: Record<string, string> = {
    CHECKLIST_TEMPLATE_NAME_CONFLICT:
      "Já existe um modelo ativo com esse nome.",
    STALE_CHECKLIST_TEMPLATE_VERSION:
      "O modelo foi alterado por outra pessoa. Atualize a página e tente novamente.",
    CHECKLIST_TEMPLATE_FORBIDDEN:
      "Você não tem permissão para alterar este modelo.",
  };

  return typeof code === "string" && messages[code] ? messages[code] : fallback;
}
