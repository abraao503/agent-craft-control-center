import { AlertCircle, CheckCircle2, FileText, RefreshCw } from "lucide-react";
import type { MetaCloudTemplate } from "@/services/whatsapp/metaCloud";
import { useOperationalChannelTemplates } from "@/hooks/useOperationalChannelTemplates";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OperationalChannelTemplateCatalogProps = {
  workspaceId: string;
  channelId: string;
};

export function OperationalChannelTemplateCatalog({
  workspaceId,
  channelId,
}: OperationalChannelTemplateCatalogProps) {
  const query = useOperationalChannelTemplates(workspaceId, channelId);

  return (
    <section className="rounded-lg border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold">Templates deste canal</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Catálogo sincronizado do WABA deste número. O atendimento oferece
              somente templates aprovados e compatíveis.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw className={cn("h-4 w-4", query.isFetching && "animate-spin")} />
          Atualizar lista
        </Button>
      </div>

      {query.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Carregando templates sincronizados...
        </p>
      ) : query.isError ? (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os templates</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Verifique o acesso ao canal e tente novamente.
            <Button
              size="sm"
              variant="outline"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : !query.data?.length ? (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum template sincronizado</AlertTitle>
          <AlertDescription>
            Sincronize os templates deste canal para conferir o status retornado
            pela Meta.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="mt-4 space-y-5">
          <TemplateGroup
            title="Válidos para responder"
            description="Aprovados pela Meta e compatíveis com o composer operacional."
            templates={query.data.filter(isOperationalTemplateValid)}
            valid
          />
          <TemplateGroup
            title="Inválidos ou indisponíveis"
            description="Não aparecem no composer até que o status ou a estrutura sejam corrigidos."
            templates={query.data.filter((template) => !isOperationalTemplateValid(template))}
          />
        </div>
      )}
    </section>
  );
}

function TemplateGroup({
  title,
  description,
  templates,
  valid = false,
}: {
  title: string;
  description: string;
  templates: MetaCloudTemplate[];
  valid?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {valid ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-600" />
        )}
        <p className="text-sm font-medium">{title}</p>
        <Badge variant={valid ? "secondary" : "outline"}>
          {templates.length}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {templates.length ? (
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} valid={valid} />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
          Nenhum template nesta categoria.
        </p>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  valid,
}: {
  template: MetaCloudTemplate;
  valid: boolean;
}) {
  const preview = getTemplatePreview(template);

  return (
    <div className="min-w-0 rounded-md border bg-muted/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{template.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {template.language}
            {template.category ? ` · ${template.category}` : ""}
          </p>
        </div>
        <Badge variant={valid ? "secondary" : "destructive"}>
          {valid ? "Válido" : getTemplateStatusLabel(template.status)}
        </Badge>
      </div>
      {preview.body ? (
        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
          {preview.body}
        </p>
      ) : null}
      {preview.buttons.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {preview.buttons.map((button, index) => (
            <Badge key={`${button.text}-${index}`} variant="outline">
              {getButtonTypeLabel(button.type)}: {button.text}
            </Badge>
          ))}
        </div>
      ) : null}
      {!valid ? (
        <p className="mt-3 text-xs leading-5 text-destructive">
          {getTemplateIssue(template)}
        </p>
      ) : null}
    </div>
  );
}

function isOperationalTemplateValid(template: MetaCloudTemplate) {
  return template.status === "APPROVED" && template.compatible;
}

function getTemplateStatusLabel(status: string) {
  const labels: Record<string, string> = {
    APPROVED: "Incompatível",
    PENDING: "Pendente",
    REJECTED: "Rejeitado",
    PAUSED: "Pausado",
    DISABLED: "Desativado",
    REMOVED: "Removido",
  };

  return labels[status] || status || "Indisponível";
}

function getTemplateIssue(template: MetaCloudTemplate) {
  if (template.status !== "APPROVED") {
    return `Status na Meta: ${getTemplateStatusLabel(template.status)}. Sincronize novamente após a Meta aprovar ou reativar o template.`;
  }

  switch (template.incompatibilityReason) {
    case "COMPONENT_NOT_SUPPORTED":
      return "A estrutura possui um componente ou botão ainda não suportado pelo atendimento operacional.";
    case "TEMPLATE_INVALID_VARIABLES":
      return "As variáveis do corpo precisam usar a numeração da Meta, como {{1}}, {{2}} e assim por diante.";
    case "TEMPLATE_REMOVED":
      return "O template não foi retornado na última sincronização da Meta. Sincronize novamente para confirmar.";
    default:
      return template.incompatibilityReason || "A estrutura não é compatível com o atendimento operacional.";
  }
}

function getTemplatePreview(template: MetaCloudTemplate) {
  const components = Array.isArray(template.components)
    ? template.components
    : [];
  const body = components.find(
    (component): component is { type: string; text?: string } =>
      isRecord(component) && component.type === "BODY",
  );
  const buttons = components
    .filter(
      (component): component is { type: string; buttons?: unknown[] } =>
        isRecord(component) && component.type === "BUTTONS",
    )
    .flatMap((component) => (Array.isArray(component.buttons) ? component.buttons : []))
    .filter(
      (button): button is { type: string; text?: string } => isRecord(button),
    );

  return {
    body: body?.text || "",
    buttons: buttons.map((button) => ({
      type: button.type,
      text: button.text || "Sem texto",
    })),
  };
}

function getButtonTypeLabel(type: string) {
  const labels: Record<string, string> = {
    QUICK_REPLY: "Resposta rápida",
    URL: "URL",
    PHONE_NUMBER: "Telefone",
    COPY_CODE: "Copiar código",
  };

  return labels[type] || type;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
