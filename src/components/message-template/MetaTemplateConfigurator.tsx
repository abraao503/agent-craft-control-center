import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listMetaCloudPipelineTemplates,
  MetaCloudTemplate,
  MetaCloudTemplateBinding,
  previewMetaCloudPipelineTemplate,
} from "@/services/whatsapp/metaCloud";
import { Loader2, RefreshCw } from "lucide-react";

export type MetaTemplateConfigValue = {
  templateId: string;
  language: string;
  bindings: Record<string, MetaCloudTemplateBinding>;
};

type Props = {
  pipelineId?: string;
  dealId?: string;
  value?: MetaTemplateConfigValue;
  onChange: (value: MetaTemplateConfigValue | undefined) => void;
  disabled?: boolean;
  label?: string;
};

function getSlots(template?: MetaCloudTemplate): string[] {
  if (!template || !Array.isArray(template.components)) return [];
  const slots: string[] = [];
  const variableCount = (value: unknown) =>
    typeof value === "string" ? value.match(/\{\{\s*\d+\s*\}\}/g) ?? [] : [];

  (template.components as Array<Record<string, unknown>>).forEach((component) => {
    const type = String(component.type ?? "").toUpperCase();
    if (type === "HEADER" && String(component.format ?? "").toUpperCase() === "TEXT") {
      variableCount(component.text).forEach((_value, index) => slots.push(`header.${index + 1}`));
    }
    if (type === "BODY") {
      variableCount(component.text).forEach((_value, index) => slots.push(`body.${index + 1}`));
    }
    if (type === "BUTTONS" && Array.isArray(component.buttons)) {
      (component.buttons as Array<Record<string, unknown>>).forEach((button, buttonIndex) => {
        if (String(button.type ?? "").toUpperCase() !== "URL") return;
        variableCount(button.url).forEach((_value, index) =>
          slots.push(`button.${buttonIndex}.${index + 1}`),
        );
      });
    }
  });

  return slots;
}

function defaultBinding(source: string): MetaCloudTemplateBinding {
  if (source === "customer") return { source: "customer", field: "name" };
  if (source === "deal") return { source: "deal", field: "id" };
  if (source === "owner") return { source: "owner", field: "name" };
  return { source: "fixed", value: "" };
}

export function MetaTemplateConfigurator({
  pipelineId,
  dealId,
  value,
  onChange,
  disabled,
  label = "Template Meta",
}: Props) {
  const [preview, setPreview] = useState<{ header: string | null; body: string } | null>(null);
  const templatesQuery = useQuery({
    queryKey: ["metaCloudPipelineTemplates", pipelineId],
    queryFn: () => listMetaCloudPipelineTemplates(pipelineId!),
    enabled: Boolean(pipelineId),
  });

  const selectedTemplate = useMemo(
    () => templatesQuery.data?.find((template) => template.id === value?.templateId),
    [templatesQuery.data, value?.templateId],
  );
  const slots = useMemo(() => getSlots(selectedTemplate), [selectedTemplate]);

  useEffect(() => {
    if (!value?.templateId || !selectedTemplate) return;
    const nextBindings = { ...value.bindings };
    let changed = false;
    slots.forEach((slot) => {
      if (!nextBindings[slot]) {
        nextBindings[slot] = { source: "fixed", value: "" };
        changed = true;
      }
    });
    if (changed) onChange({ ...value, bindings: nextBindings });
  }, [onChange, selectedTemplate, slots, value]);

  const previewMutation = useMutation({
    mutationFn: () =>
      previewMetaCloudPipelineTemplate({
        pipelineId: pipelineId!,
        templateId: value!.templateId,
        bindings: value!.bindings,
        dealId,
      }),
    onSuccess: (data) => setPreview({ header: data.header, body: data.body }),
    onError: () => setPreview(null),
  });

  if (!pipelineId) {
    return (
      <Alert>
        <AlertDescription>
          Salve e conecte a pipeline à Meta antes de configurar templates.
        </AlertDescription>
      </Alert>
    );
  }

  const updateBinding = (slot: string, binding: MetaCloudTemplateBinding) => {
    if (!value) return;
    onChange({ ...value, bindings: { ...value.bindings, [slot]: binding } });
    setPreview(null);
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => void templatesQuery.refetch()}
          disabled={templatesQuery.isFetching || disabled}
          title="Atualizar templates"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {templatesQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando templates aprovados…
        </div>
      ) : templatesQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Não foi possível carregar os templates Meta.</AlertDescription>
        </Alert>
      ) : (templatesQuery.data ?? []).length === 0 ? (
        <Alert>
          <AlertDescription>
            Nenhum template aprovado e compatível com o WABA deste pipeline foi
            sincronizado. A seção Meta pode listar templates aprovados de
            outros WABAs ou com componentes não suportados.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Select
            value={value?.templateId ?? ""}
            onValueChange={(templateId) => {
              const template = templatesQuery.data?.find((item) => item.id === templateId);
              if (!template) return;
              const bindings: Record<string, MetaCloudTemplateBinding> = {};
              getSlots(template).forEach((slot) => {
                bindings[slot] = { source: "fixed", value: "" };
              });
              onChange({ templateId, language: template.language, bindings });
              setPreview(null);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um template aprovado" />
            </SelectTrigger>
            <SelectContent>
              {(templatesQuery.data ?? []).map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} · {template.language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTemplate && slots.map((slot) => {
            const binding = value?.bindings[slot] ?? defaultBinding("fixed");
            const fieldValue = binding.source === "fixed" ? binding.value : `${binding.source}:${binding.field}`;
            return (
              <div key={slot} className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{slot}</Label>
                  <Select
                    value={binding.source}
                    onValueChange={(source) => updateBinding(slot, defaultBinding(source))}
                    disabled={disabled}
                  >
                    <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Valor fixo</SelectItem>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="deal">Deal contextual</SelectItem>
                      <SelectItem value="owner">Responsável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valor/campo</Label>
                  {binding.source === "fixed" ? (
                    <Input
                      value={fieldValue}
                      onChange={(event) => updateBinding(slot, { source: "fixed", value: event.target.value })}
                      disabled={disabled}
                    />
                  ) : (
                    <Select
                      value={fieldValue}
                      onValueChange={(selected) => {
                        const [source, field] = selected.split(":");
                        updateBinding(slot, source === "customer"
                          ? { source: "customer", field: field as "name" | "firstName" | "phone" | "email" }
                          : source === "deal"
                            ? { source: "deal", field: field as "id" | "pipeline" | "stage" }
                            : { source: "owner", field: "name" });
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger><SelectValue placeholder="Campo" /></SelectTrigger>
                      <SelectContent>
                        {binding.source === "customer" && <>
                          <SelectItem value="customer:name">Nome completo</SelectItem>
                          <SelectItem value="customer:firstName">Primeiro nome</SelectItem>
                          <SelectItem value="customer:phone">Telefone</SelectItem>
                          <SelectItem value="customer:email">E-mail</SelectItem>
                        </>}
                        {binding.source === "deal" && <>
                          <SelectItem value="deal:id">Identificador</SelectItem>
                          <SelectItem value="deal:pipeline">Pipeline</SelectItem>
                          <SelectItem value="deal:stage">Etapa</SelectItem>
                        </>}
                        {binding.source === "owner" && <SelectItem value="owner:name">Responsável</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={() => previewMutation.mutate()}
            disabled={disabled || !value?.templateId || previewMutation.isPending}
          >
            {previewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Validar e pré-visualizar
          </Button>
          {previewMutation.isError && (
            <Alert variant="destructive"><AlertDescription>Revise os bindings e tente novamente.</AlertDescription></Alert>
          )}
          {preview && (
            <div className="rounded-md bg-muted p-3 text-sm">
              {preview.header && <p className="font-medium">{preview.header}</p>}
              <p>{preview.body}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
