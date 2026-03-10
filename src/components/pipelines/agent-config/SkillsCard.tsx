import React from "react";
import { AgentFormData } from "@/types/agent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { listGoogleCalendarIntegrations } from "@/services/google-calendar/listGoogleCalendarIntegrations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Loader2, Info } from "lucide-react";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SkillsCardProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

export const SkillsCard: React.FC<SkillsCardProps> = ({
  formData,
  updateFormData,
}) => {
  const { workspaceId } = useWorkspaceManager({ queryKeys: [] });

  const {
    data: integrationsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listGoogleCalendarIntegrations", workspaceId],
    queryFn: () =>
      listGoogleCalendarIntegrations({ workspaceId: workspaceId! }),
    enabled: !!workspaceId,
  });

  const activeIntegrations =
    integrationsResponse?.items?.filter(
      (integration) => integration.isActive,
    ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills do Agente</CardTitle>
        <CardDescription>
          Habilidades adicionais que o assistente pode usar durante as
          conversas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Google Calendar</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Permite que o agente consulte disponibilidade e faça agendamentos
            diretamente no seu calendário.
          </p>

          <div className="space-y-2 pt-2">
            <Label htmlFor="google-calendar-integration">
              Integração a ser utilizada
            </Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando integrações...
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Erro ao carregar integrações. Tente recarregar a página.
                </AlertDescription>
              </Alert>
            ) : activeIntegrations.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma conta do Google Calendar vinculada ao workspace. Vá na
                  seção de Integrações para conectar uma conta.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Select
                  value={formData.googleCalendarIntegrationId || "none"}
                  onValueChange={(value) => {
                    updateFormData({
                      googleCalendarIntegrationId:
                        value === "none" ? null : value,
                    });
                  }}
                >
                  <SelectTrigger
                    id="google-calendar-integration"
                    className="w-full md:w-[350px]"
                  >
                    <SelectValue placeholder="Selecione uma conta do Google" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (Desativada)</SelectItem>
                    {activeIntegrations.map((integration) => (
                      <SelectItem key={integration.id} value={integration.id}>
                        {integration.googleEmail}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.googleCalendarIntegrationId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() =>
                      updateFormData({ googleCalendarIntegrationId: null })
                    }
                  >
                    Desvincular
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
