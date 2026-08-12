import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, ShieldOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

type Status = "connected" | "permission_denied" | "unknown_error" | "loading";

const AUTO_CLOSE_DELAY_MS = 3000;

export default function IntegrationResponsePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [countdown, setCountdown] = useState(AUTO_CLOSE_DELAY_MS / 1000);
  const isMeta = searchParams.get("meta") !== null;
  const { t } = useTranslation();

  useEffect(() => {
    const googleCalendar = searchParams.get("google_calendar");
    const meta = searchParams.get("meta");

    if (meta === "meta_connected") {
      setStatus("connected");
    } else if (
      meta === "meta_missing_scopes" ||
      meta === "meta_permission_denied"
    ) {
      setStatus("permission_denied");
    } else if (meta) {
      setStatus("unknown_error");
    } else if (googleCalendar === "connected") {
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
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <LanguageSwitcher className="absolute right-4 top-4" />
        <div className="text-center max-w-sm space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {isMeta ? t("integrationResponse.metaConnected") : t("integrationResponse.calendarConnected")}
          </h1>
          <p className="text-muted-foreground">
            {t("integrationResponse.linkedSuccessfully", { seconds: countdown })}
          </p>
          <Button variant="outline" onClick={() => window.close()}>
            {t("integrationResponse.closeNow")}
          </Button>
        </div>
      </div>
    );
  }

  if (status === "permission_denied") {
    const integrationName = isMeta ? "Meta" : "Google Calendar";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <LanguageSwitcher className="absolute right-4 top-4" />
        <div className="text-center max-w-sm space-y-4">
          <ShieldOff className="h-16 w-16 text-yellow-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {t("integrationResponse.permissionDenied")}
          </h1>
          <p className="text-muted-foreground">
            {t("integrationResponse.permissionDescription", { integration: integrationName })}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => window.close()} variant="outline">
              {t("common.close")}
            </Button>
            <Button onClick={() => window.history.back()}>
              {t("integrationResponse.retry")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // unknown_error
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <LanguageSwitcher className="absolute right-4 top-4" />
      <div className="text-center max-w-sm space-y-4">
        <XCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">{t("integrationResponse.unknownError")}</h1>
        <p className="text-muted-foreground">
          {t("integrationResponse.unknownDescription", { integration: isMeta ? "Meta" : "Google Calendar" })}
        </p>
        <Button onClick={() => window.close()} variant="outline">
          {t("common.close")}
        </Button>
      </div>
    </div>
  );
}
