import { useState } from "react";
import { AxiosError } from "axios";
import {
  AlertCircle,
  ClipboardCheck,
  Loader2,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useOperationalChecklistTemplateMutations,
  useOperationalChecklistTemplates,
} from "@/hooks/useOperationalChecklistTemplates";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { OperationalChecklistTemplate } from "@/types/operational-checklist";

export default function OperationChecklistTemplatesPage() {
  const { currentWorkspace } = useWorkspaceContext();
  const { has } = usePermissions();
  const { toast } = useToast();
  const workspaceId =
    currentWorkspace?.type === "OPERATION" ? currentWorkspace.id : undefined;
  const canManageOfficial = has("manage:operation-checklists");
  const canCreatePersonal = has("operate:operation-attendances");
  const canCreate = canManageOfficial || canCreatePersonal;

  const templatesQuery = useOperationalChecklistTemplates(workspaceId);
  const mutations = useOperationalChecklistTemplateMutations(workspaceId);
  const [editingTemplate, setEditingTemplate] =
    useState<OperationalChecklistTemplate | null>(null);
  const [templateToArchive, setTemplateToArchive] =
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
          active: values.active,
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
            ? "O modelo ficará disponível para toda a equipe autorizada."
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

  const handleArchive = async () => {
    if (!templateToArchive) return;

    try {
      await mutations.archive.mutateAsync({
        templateId: templateToArchive.id,
        expectedVersion: templateToArchive.version,
      });
      toast({
        title: "Modelo arquivado",
        description: "Ele não aparecerá como opção para novos atendimentos.",
      });
      setTemplateToArchive(null);
    } catch (error) {
      toast({
        title: "Não foi possível arquivar o modelo",
        description: getApiErrorMessage(
          error,
          "O modelo pode ter sido alterado por outra pessoa.",
        ),
        variant: "destructive",
      });
    }
  };

  const templates = templatesQuery.data ?? [];
  const officialTemplates = templates.filter(
    (template) => template.visibility === "OFFICIAL",
  );
  const personalTemplates = templates.filter(
    (template) => template.visibility === "PERSONAL",
  );
  const isSaving = mutations.create.isPending || mutations.update.isPending;

  return (
    <section className="mx-auto w-full max-w-[1180px] space-y-6 pb-8">
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

      <header className="flex flex-col gap-5 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Biblioteca operacional
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Modelos de checklist
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
              Monte as etapas uma vez e aplique a lista a cada atendimento. A
              equipe acompanha o que já foi enviado ou concluído direto na
              conversa.
            </p>
          </div>
        </div>
        {canCreate ? (
          <Button className="w-full shrink-0 sm:w-auto" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Criar modelo
          </Button>
        ) : null}
      </header>

      <ChecklistHowItWorks />

      {currentWorkspace?.type !== "OPERATION" ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Workspace operacional não selecionado</AlertTitle>
          <AlertDescription>
            Selecione um workspace operacional para visualizar os modelos.
          </AlertDescription>
        </Alert>
      ) : templatesQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Carregando modelos...
            </span>
          </CardContent>
        </Card>
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
        <div className="grid items-start gap-8 xl:grid-cols-2 xl:gap-10">
          <TemplateSection
            sectionId="official-templates"
            title="Modelos oficiais"
            visibility="OFFICIAL"
            description="Modelos mantidos pela gestão e disponíveis para a equipe."
            templates={officialTemplates}
            emptyMessage="Nenhum modelo oficial foi criado ainda."
            canEdit={canManageOfficial}
            isArchiving={mutations.archive.isPending}
            onEdit={openEdit}
            onArchive={setTemplateToArchive}
          />
          <TemplateSection
            sectionId="personal-templates"
            title="Meus modelos pessoais"
            visibility="PERSONAL"
            description="Modelos particulares para sua rotina. Eles não passam por aprovação."
            templates={personalTemplates}
            emptyMessage={
              canCreatePersonal
                ? "Você ainda não criou um modelo pessoal."
                : "Nenhum modelo pessoal disponível para este usuário."
            }
            canEdit={canCreatePersonal}
            isArchiving={mutations.archive.isPending}
            onEdit={openEdit}
            onArchive={setTemplateToArchive}
          />
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
        open={Boolean(templateToArchive)}
        onOpenChange={(open) => {
          if (!open && !mutations.archive.isPending) setTemplateToArchive(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo “{templateToArchive?.name}” ficará inativo para novos
              atendimentos. Checklists já aplicados continuarão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutations.archive.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutations.archive.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleArchive();
              }}
            >
              {mutations.archive.isPending ? "Arquivando..." : "Arquivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function ChecklistHowItWorks() {
  const steps = [
    {
      title: "Monte as etapas",
      description: "Reúna os passos que se repetem no seu processo.",
    },
    {
      title: "Aplique na conversa",
      description: "Cada atendimento recebe sua própria cópia do modelo.",
    },
    {
      title: "Acompanhe o andamento",
      description: "Marque o que chegou ou já foi resolvido.",
    },
  ];

  return (
    <section aria-labelledby="checklist-how-it-works">
      <Card className="border-primary/15 bg-muted/20 shadow-none">
        <CardContent className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)] lg:items-center">
          <div className="min-w-0">
            <h2
              id="checklist-how-it-works"
              className="text-sm font-semibold tracking-tight"
            >
              Do modelo à conversa
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              O progresso de uma conversa fica na cópia daquele atendimento e
              não altera o modelo original.
            </p>
          </div>

          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex min-w-0 items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}

type TemplateSectionProps = {
  sectionId: string;
  title: string;
  visibility: OperationalChecklistTemplate["visibility"];
  description: string;
  templates: OperationalChecklistTemplate[];
  emptyMessage: string;
  canEdit: boolean;
  isArchiving: boolean;
  onEdit: (template: OperationalChecklistTemplate) => void;
  onArchive: (template: OperationalChecklistTemplate) => void;
};

function TemplateSection({
  sectionId,
  title,
  visibility,
  description,
  templates,
  emptyMessage,
  canEdit,
  isArchiving,
  onEdit,
  onArchive,
}: TemplateSectionProps) {
  const isOfficial = visibility === "OFFICIAL";
  const SectionIcon = isOfficial ? ClipboardCheck : UserRound;

  return (
    <section className="min-w-0" aria-labelledby={sectionId}>
      <div className="flex items-start justify-between gap-3 border-b pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <SectionIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id={sectionId} className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 whitespace-nowrap">
          {templates.length} {templates.length === 1 ? "modelo" : "modelos"}
        </Badge>
      </div>

      {templates.length ? (
        <div className="mt-4 space-y-3">
          {templates.map((template) => (
            <OperationalChecklistTemplateCard
              key={template.id}
              template={template}
              canEdit={canEdit}
              isArchiving={isArchiving}
              onEdit={onEdit}
              onArchive={onArchive}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed p-4">
          <SectionIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm leading-5 text-muted-foreground">
            {emptyMessage}
          </p>
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
