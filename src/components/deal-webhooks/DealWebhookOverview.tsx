import { format } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { DealWebhook } from "@/types/deal-webhook";
import { useAppLocale } from "@/i18n/LocaleProvider";

interface DealWebhookOverviewProps {
  webhook: DealWebhook;
}

export function DealWebhookOverview({ webhook }: DealWebhookOverviewProps) {
  const { locale } = useAppLocale();
  const dateLocale = locale === "es-ES" ? es : ptBR;
  const datePattern = locale === "es-ES" ? "dd/MM/yyyy 'a las' HH:mm" : "dd/MM/yyyy 'às' HH:mm";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Nome</Label>
              <p className="font-medium">{webhook.name}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Status</Label>
              <p>
                <Badge
                  variant={webhook.status === "ACTIVE" ? "default" : "secondary"}
                  className={
                    webhook.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : ""
                  }
                >
                  {webhook.status === "ACTIVE" ? "Ativo" : "Inativo"}
                </Badge>
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Criado em</Label>
              <p className="font-medium">
                {format(webhook.createdAt, datePattern, { locale: dateLocale })}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Atualizado em</Label>
              <p className="font-medium">
                {format(webhook.updatedAt, datePattern, { locale: dateLocale })}
              </p>
            </div>
          </div>

          {webhook.automation?.sendWelcomeMessage && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm text-muted-foreground">
                Mensagem de boas-vindas
              </Label>
              <p className="mt-1">{webhook.automation.welcomeMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuração da Pipeline</CardTitle>
          <CardDescription>
            Os negócios criados por este webhook serão adicionados nesta
            pipeline e etapa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Pipeline</Label>
              <p className="font-medium mt-1">{webhook.pipeline.name}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Etapa</Label>
              <p className="font-medium mt-1">
                {webhook.stage ? webhook.stage.name : "Primeira etapa da pipeline"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
