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
import { Badge } from "@/components/ui/badge";
import { Calendar, Unplug, Loader2, CheckCircle2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";

interface Props {
  workspaceId: string;
  showHeader?: boolean;
}

export function GoogleCalendarIntegration({
  workspaceId,
  showHeader = true,
}: Props) {
  const { toast } = useToast();
  const { t } = useTranslation();
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
          title: t("common.error"),
          description: t("integrations.authorizationError"),
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("integrations.connectError"),
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
        title: t("common.success"),
        description: t("integrations.disconnectSuccess"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("integrations.disconnectError"),
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            {t("integrations.googleDescription")}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={showHeader ? "space-y-4" : "space-y-4 pt-6"}>
        {isLoading ? (
          <div className="flex items-center justify-center rounded-lg border py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {integrations.length > 0 && (
              <div className="overflow-hidden rounded-lg border">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex flex-col gap-3 border-b p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className="font-medium text-green-800 dark:text-green-300 truncate"
                          title={integration.googleEmail}
                        >
                          {integration.googleEmail}
                        </p>
                        <Badge
                          variant={integration.isActive ? "default" : "outline"}
                          className="mt-1"
                        >
                          {integration.isActive
                            ? t("integrations.active")
                            : t("integrations.inactive")}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectMutation.mutate(integration.id)}
                      disabled={disconnectMutation.isPending}
                      className="w-full shrink-0 text-destructive hover:bg-destructive/10 sm:w-auto"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Unplug className="mr-2 h-4 w-4" />
                      )}
                      {t("integrations.disconnect")}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
              {integrations.length === 0 && (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {t("integrations.noLinkedAccount")}
                  </p>
                </div>
              )}
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {integrations.length > 0
                  ? t("integrations.linkAnother")
                  : t("integrations.linkGoogle")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
