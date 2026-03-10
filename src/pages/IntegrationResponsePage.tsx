import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, ShieldOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "connected" | "permission_denied" | "unknown_error" | "loading";

const AUTO_CLOSE_DELAY_MS = 3000;

export default function IntegrationResponsePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [countdown, setCountdown] = useState(AUTO_CLOSE_DELAY_MS / 1000);

  useEffect(() => {
    const googleCalendar = searchParams.get("google_calendar");

    if (googleCalendar === "connected") {
      setStatus("connected");
    } else if (googleCalendar === "permission_denied") {
      setStatus("permission_denied");
    } else {
      setStatus("unknown_error");
    }
  }, [searchParams]);

  // Auto-close on success
  useEffect(() => {
    if (status !== "connected") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            Google Calendar conectado!
          </h1>
          <p className="text-muted-foreground">
            Sua conta foi vinculada com sucesso. Esta janela será fechada
            automaticamente em{" "}
            <span className="font-semibold text-foreground">{countdown}s</span>.
          </p>
          <Button variant="outline" onClick={() => window.close()}>
            Fechar agora
          </Button>
        </div>
      </div>
    );
  }

  if (status === "permission_denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm space-y-4">
          <ShieldOff className="h-16 w-16 text-yellow-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            Permissão negada
          </h1>
          <p className="text-muted-foreground">
            O acesso ao Google Calendar não foi concedido. Para concluir a
            integração, é necessário permitir o acesso aos eventos do
            calendário.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => window.close()} variant="outline">
              Fechar
            </Button>
            <Button onClick={() => window.history.back()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // unknown_error
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-sm space-y-4">
        <XCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Ocorreu um erro</h1>
        <p className="text-muted-foreground">
          Não foi possível completar a integração com o Google Calendar. Por
          favor, feche esta janela e tente novamente.
        </p>
        <Button onClick={() => window.close()} variant="outline">
          Fechar
        </Button>
      </div>
    </div>
  );
}
