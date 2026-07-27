import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CompanyWhatsAppIntegration } from "@/types/whatsapp";
import {
  WhatsAppIntegrationName,
  WHATSAPP_INTEGRATION_NAMES,
} from "@/types/whatsapp-integration";
import { PipelineStageMinimal } from "@/types/pipeline";
import { Eye, EyeOff, MessageSquare } from "lucide-react";

interface ConfigurationsTabProps {
  stages: PipelineStageMinimal[];
  availableWhatsAppIntegrations: CompanyWhatsAppIntegration[];
  companyWhatsappIntegrationId?: string | null;
  useWhatsApp: boolean;
  whatsAppIntegrationName: WhatsAppIntegrationName;
  initialStageOrder: number;
  externalToken: string;
  externalClientToken: string;
  postbackUrl: string;
  onUseWhatsAppChange: (value: boolean) => void;
  onWhatsAppIntegrationNameChange: (value: WhatsAppIntegrationName) => void;
  onInitialStageOrderChange: (value: number) => void;
  onExternalTokenChange: (value: string) => void;
  onExternalClientTokenChange: (value: string) => void;
  onPostbackUrlChange: (value: string) => void;
}

export const ConfigurationsTab: React.FC<ConfigurationsTabProps> = ({
  stages,
  useWhatsApp,
  whatsAppIntegrationName,
  initialStageOrder,
  externalToken,
  externalClientToken,
  postbackUrl,
  onUseWhatsAppChange,
  onWhatsAppIntegrationNameChange,
  onInitialStageOrderChange,
  onExternalTokenChange,
  onExternalClientTokenChange,
  onPostbackUrlChange,
}) => {
  const [showInstanceToken, setShowInstanceToken] = useState(false);
  const [showClientToken, setShowClientToken] = useState(false);

  return (
    <div className="space-y-4 [&_.p-6]:p-4 [&_h3]:text-sm [&_p.text-muted-foreground]:text-xs">
      <Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">Integração WhatsApp</CardTitle>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${useWhatsApp ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  {useWhatsApp ? "Ligada" : "Desligada"}
                </span>
              </div>
              <CardDescription className="text-xs">
                {useWhatsApp ? "Defina como os novos leads chegam a este funil." : "Ative para receber novos leads pelo WhatsApp."}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Label htmlFor="use-whatsapp" className="cursor-pointer text-sm">{useWhatsApp ? "Desativar" : "Ativar"}</Label>
            <Switch
              id="use-whatsapp"
              checked={useWhatsApp}
              onCheckedChange={(checked) => {
                onUseWhatsAppChange(checked);
                if (!checked) {
                  onExternalTokenChange("");
                  onExternalClientTokenChange("");
                  onPostbackUrlChange("");
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {useWhatsApp ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div>
                  <CardTitle className="text-sm">Entrada de leads</CardTitle>
                  <CardDescription className="text-xs">Escolha o provedor e a primeira etapa do funil.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Integração</Label>
                <Select
                  value={whatsAppIntegrationName}
                  onValueChange={(value) =>
                    onWhatsAppIntegrationNameChange(
                      value as WhatsAppIntegrationName,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WHATSAPP_INTEGRATION_NAMES.EVOLUX}>
                      Evolux
                    </SelectItem>
                    <SelectItem value={WHATSAPP_INTEGRATION_NAMES.ZAPI}>
                      Z-API
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Etapa Inicial</Label>
                <Select
                  value={initialStageOrder.toString()}
                  onValueChange={(value) =>
                    onInitialStageOrderChange(parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha a etapa inicial" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage, index) => (
                      <SelectItem key={stage.id} value={index.toString()}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Novos leads do WhatsApp serão adicionados nesta etapa
                </p>
              </div>
            </CardContent>
          </Card>

          {whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.ZAPI && (
            <Card className="border-primary/15">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">Credenciais Z-API</CardTitle>
                <CardDescription className="text-xs">Esses dados conectam a instância selecionada e ficam ocultos enquanto você digita.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Token da instância</Label>
                    <div className="relative">
                      <Input type={showInstanceToken ? "text" : "password"} value={externalToken} onChange={(e) => onExternalTokenChange(e.target.value)} placeholder="Digite o token da instância" className="pr-10" />
                      <button type="button" onClick={() => setShowInstanceToken((value) => !value)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={showInstanceToken ? "Ocultar token" : "Revelar token"}>{showInstanceToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Token de segurança da conta</Label>
                    <div className="relative">
                      <Input type={showClientToken ? "text" : "password"} value={externalClientToken} onChange={(e) => onExternalClientTokenChange(e.target.value)} placeholder="Digite o token de segurança da conta" className="pr-10" />
                      <button type="button" onClick={() => setShowClientToken((value) => !value)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={showClientToken ? "Ocultar token" : "Revelar token"}>{showClientToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>API da instância (URL)</Label>
                    <Input
                      value={postbackUrl}
                      onChange={(e) => onPostbackUrlChange(e.target.value)}
                      placeholder="Digite a URL da API da instância"
                    />
                  </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <p className="px-1 text-sm text-muted-foreground">Ao ativar, selecione o tipo de integração e a etapa onde os novos leads devem entrar.</p>
      )}
    </div>
  );
};
