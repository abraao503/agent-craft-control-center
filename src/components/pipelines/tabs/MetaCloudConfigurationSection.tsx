import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PipelineStageMinimal } from "@/types/pipeline";
import { CompanyWhatsAppIntegrationFull } from "@/types/whatsapp";
import { useMetaCloudPipelineConfiguration } from "@/hooks/useMetaCloudPipelineConfiguration";

type Props = {
  enabled: boolean;
  canManageIntegrations: boolean;
  pipelineId?: string;
  stages: PipelineStageMinimal[];
  phoneNumberId: string | null;
  initialStageOrder: number;
  integration?: CompanyWhatsAppIntegrationFull | null;
  onPhoneNumberChange: (value: string | null) => void;
  onInitialStageOrderChange: (value: number) => void;
};

function errorMessage(error: unknown) {
  const responseMessage = (
    error as { response?: { data?: { message?: string } } }
  )?.response?.data?.message;
  return responseMessage || "Não foi possível concluir a sincronização.";
}

export function MetaCloudConfigurationSection({
  enabled,
  canManageIntegrations,
  pipelineId,
  stages,
  phoneNumberId,
  initialStageOrder,
  integration,
  onPhoneNumberChange,
  onInitialStageOrderChange,
}: Props) {
  const {
    diagnosticQuery,
    phoneNumbersQuery,
    templatesQuery,
    syncPhoneNumbersMutation,
    syncTemplatesMutation,
  } = useMetaCloudPipelineConfiguration(enabled, canManageIntegrations);

  if (!enabled) return null;

  const diagnostic = diagnosticQuery.data;
  const pipelineDiagnostic = diagnostic?.integrations.find(
    (item) => item.pipelineId === pipelineId,
  );
  const hasIntegration = Boolean(integration || pipelineDiagnostic);
  const active = integration?.active ?? pipelineDiagnostic?.active ?? false;
  const status = !hasIntegration
    ? undefined
    : active
      ? integration?.connectionStatus || pipelineDiagnostic?.connectionStatus
      : "DISCONNECTED";
  const statusLabel =
    status === "CONNECTED"
      ? "Conectado"
      : status === "DISCONNECTED"
        ? "Desconectado"
        : "Não configurado";

  return (
    <Card className="border-blue-500/20 bg-blue-500/[0.03]">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">WhatsApp Cloud API oficial</CardTitle>
            <CardDescription className="text-xs">
              Use um número provisionado pela Meta. Credenciais, QR Code e webhook não são necessários.
            </CardDescription>
          </div>
          <Badge variant={status === "CONNECTED" ? "default" : "outline"}>
            {status === "CONNECTED" ? (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            ) : null}
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {integration?.metaDisplayPhoneNumber ? (
          <div className="rounded-md border bg-background p-3 text-sm">
            <p className="font-medium">Número conectado</p>
            <p className="text-muted-foreground">{integration.metaDisplayPhoneNumber}</p>
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Número provisionado</Label>
            <Select
              value={phoneNumberId || undefined}
              onValueChange={onPhoneNumberChange}
              disabled={
                !pipelineId ||
                !canManageIntegrations ||
                diagnosticQuery.isLoading ||
                phoneNumbersQuery.isLoading
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    pipelineId
                      ? "Escolha um número"
                      : "Salve o pipeline para escolher"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(phoneNumbersQuery.data || []).map((phone) => {
                  const occupiedByAnotherPipeline = Boolean(
                    phone.assignedPipelineId && phone.assignedPipelineId !== pipelineId,
                  );
                  return (
                    <SelectItem
                      key={phone.phoneNumberId}
                      value={phone.phoneNumberId}
                      disabled={occupiedByAnotherPipeline}
                    >
                      {phone.displayPhoneNumber}
                      {occupiedByAnotherPipeline ? " (usado por outro pipeline)" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {!pipelineId ? (
              <p className="text-xs text-muted-foreground">
                O pipeline precisa ser salvo antes de vincular um número Meta.
              </p>
            ) : phoneNumbersQuery.isError ? (
              <p className="text-xs text-destructive">{errorMessage(phoneNumbersQuery.error)}</p>
            ) :
              diagnostic?.enabled === true &&
              !phoneNumbersQuery.isLoading &&
              !phoneNumbersQuery.data?.length ? (
              <p className="text-xs text-muted-foreground">
                Nenhum número sincronizado para esta empresa.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Etapa inicial</Label>
            <Select
              value={String(initialStageOrder)}
              onValueChange={(value) => onInitialStageOrderChange(Number(value))}
              disabled={!canManageIntegrations}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha a etapa inicial" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage, index) => (
                  <SelectItem key={stage.id} value={String(stage.order ?? index)}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border bg-background p-3 text-sm">
          <div className="flex items-start gap-2">
            {diagnosticQuery.isError ? (
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Diagnóstico</p>
              <p className="text-muted-foreground">
                {diagnosticQuery.isLoading
                  ? "Consultando a configuração..."
                  : diagnosticQuery.isError
                    ? errorMessage(diagnosticQuery.error)
                    : pipelineDiagnostic?.diagnosticMessage ||
                      (diagnostic?.configured
                        ? "Ambiente Meta configurado."
                        : "Complete as credenciais do ambiente Meta para sincronizar.")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              !canManageIntegrations ||
              diagnosticQuery.isLoading ||
              syncPhoneNumbersMutation.isPending
            }
            onClick={() => syncPhoneNumbersMutation.mutate()}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            {syncPhoneNumbersMutation.isPending ? "Sincronizando números..." : "Sincronizar números"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              !canManageIntegrations ||
              diagnosticQuery.isLoading ||
              syncTemplatesMutation.isPending
            }
            onClick={() => syncTemplatesMutation.mutate()}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            {syncTemplatesMutation.isPending ? "Sincronizando templates..." : "Sincronizar templates"}
          </Button>
        </div>

        {syncPhoneNumbersMutation.isError ? (
          <p className="text-xs text-destructive">{errorMessage(syncPhoneNumbersMutation.error)}</p>
        ) : null}
        {syncTemplatesMutation.isError ? (
          <p className="text-xs text-destructive">{errorMessage(syncTemplatesMutation.error)}</p>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-medium">Templates aprovados</p>
          {diagnosticQuery.isLoading || templatesQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando templates...</p>
          ) : templatesQuery.isError ? (
            <p className="text-xs text-destructive">{errorMessage(templatesQuery.error)}</p>
          ) : !templatesQuery.data?.length ? (
            <p className="text-xs text-muted-foreground">Nenhum template aprovado sincronizado.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {templatesQuery.data.map((template) => (
                <Badge key={`${template.name}-${template.language}`} variant="secondary">
                  {template.name} · {template.language}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
