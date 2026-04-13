import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listGoogleCalendarIntegrations } from "@/services/google-calendar/listGoogleCalendarIntegrations";
import { getGoogleAuthUrl } from "@/services/google-calendar/getGoogleAuthUrl";
import { disconnectGoogleCalendar } from "@/services/google-calendar/disconnectGoogleCalendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Unplug, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  workspaceId: string;
}

export function GoogleCalendarIntegration({ workspaceId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const authWindowRef = useRef<Window | null>(null);
  const authTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ["googleCalendarIntegrations", workspaceId],
    queryFn: () => listGoogleCalendarIntegrations({ workspaceId }),
    enabled: !!workspaceId,
    refetchInterval: isAuthOpen ? 2000 : false, // polla a lista a cada 2s se estiver aberto
  });

  const integrations = integrationsData?.items || [];

  // Fecha o popup assim que detectar q o banco de dados tem +1 integração
  const prevCountRef = useRef(integrations.length);
  useEffect(() => {
    if (integrations.length > prevCountRef.current) {
      if (authWindowRef.current && !authWindowRef.current.closed) {
        authWindowRef.current.close();
      }
      setIsAuthOpen(false);
    }
    prevCountRef.current = integrations.length;
  }, [integrations.length]);

  // Limpeza de intervalos do componente
  useEffect(() => {
    return () => {
      if (authTimerRef.current) clearInterval(authTimerRef.current);
    };
  }, []);

  const connectMutation = useMutation({
    mutationFn: () => getGoogleAuthUrl({ workspaceId }),
    onSuccess: (res) => {
      if (res.authUrl) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const win = window.open(
          res.authUrl,
          "GoogleCalendarAuth",
          `width=${width},height=${height},top=${top},left=${left}`,
        );

        if (win) {
          authWindowRef.current = win;
          setIsAuthOpen(true);

          authTimerRef.current = setInterval(() => {
            if (win.closed) {
              clearInterval(authTimerRef.current!);
              setIsAuthOpen(false);
              queryClient.invalidateQueries({
                queryKey: ["googleCalendarIntegrations", workspaceId],
              });
            } else {
              try {
                // Checa se já voltou pro nosso frontend (Callback redirect)
                if (win.location.origin === window.location.origin) {
                  const params = new URLSearchParams(win.location.search);
                  const calendarStatus = params.get("google_calendar");

                  // Apenas fecha automaticamente em caso de sucesso.
                  // Em caso de erro (permission_denied, unknown_error), deixa
                  // o popup aberto para o usuário ler o feedback e agir.
                  if (calendarStatus === "connected") {
                    win.close();
                    clearInterval(authTimerRef.current!);
                    setIsAuthOpen(false);
                    queryClient.invalidateQueries({
                      queryKey: ["googleCalendarIntegrations", workspaceId],
                    });
                  }
                }
              } catch (e) {
                // Ignorar erros Cross-Origin enquanto navega nas telas do Google
              }
            }
          }, 1000);
        } else {
          // Fallback se o navegador bloquear o popup
          window.location.href = res.authUrl;
        }
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível gerar a URL de autorização.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao conectar com Google Calendar.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (integrationId: string) =>
      disconnectGoogleCalendar({ integrationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["googleCalendarIntegrations", workspaceId],
      });
      toast({
        title: "Sucesso",
        description: "Google Calendar desconectado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao desconectar Google Calendar.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Vincule suas contas do Google para gerenciar agendamentos através do
          assistente ou da agendamentos de sua empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {integrations.length > 0 && (
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500 shrink-0" />
                      <div className="min-w-0">
                        <p
                          className="font-medium text-green-800 dark:text-green-300 truncate"
                          title={integration.googleEmail}
                        >
                          {integration.googleEmail}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {integration.isActive ? "Ativo" : "Inativo"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectMutation.mutate(integration.id)}
                      disabled={disconnectMutation.isPending}
                      className="text-destructive hover:bg-destructive/10 shrink-0 w-full sm:w-auto"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Unplug className="h-4 w-4 mr-2" />
                      )}
                      Desconectar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/30 mt-4">
              {integrations.length === 0 && (
                <>
                  <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground mb-4 max-w-sm">
                    Conecte seu Google Calendar para o envio de e-mails, criação
                    de eventos automáticos e sincronização.
                  </p>
                </>
              )}
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {integrations.length > 0
                  ? "Vincular outra conta"
                  : "Vincular Google Calendar"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
