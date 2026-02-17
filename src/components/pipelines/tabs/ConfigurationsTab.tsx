import React from "react";
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
import { MessageSquare } from "lucide-react";

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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>Integração WhatsApp</CardTitle>
              <CardDescription>
                Conecte este funil a uma integração WhatsApp para receber leads
                automaticamente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-whatsapp">Usar WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Ative para receber leads do WhatsApp neste funil
              </p>
            </div>
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

          {useWhatsApp && (
            <>
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

              {whatsAppIntegrationName === WHATSAPP_INTEGRATION_NAMES.ZAPI && (
                <>
                  <div className="space-y-2">
                    <Label>Token da instância</Label>
                    <Input
                      value={externalToken}
                      onChange={(e) => onExternalTokenChange(e.target.value)}
                      placeholder="Digite o token da instância"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Token de segurança da conta</Label>
                    <Input
                      value={externalClientToken}
                      onChange={(e) =>
                        onExternalClientTokenChange(e.target.value)
                      }
                      placeholder="Digite o token de segurança da conta"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>API da instância (URL)</Label>
                    <Input
                      value={postbackUrl}
                      onChange={(e) => onPostbackUrlChange(e.target.value)}
                      placeholder="Digite a URL da API da instância"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
