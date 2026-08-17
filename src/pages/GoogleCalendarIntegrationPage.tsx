import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { GoogleCalendarIntegration } from "@/components/google-calendar/GoogleCalendarIntegration";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

export default function GoogleCalendarIntegrationPage() {
  const { workspaceId } = useWorkspaceManager();
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <Link
        to="/integrations"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("integrations.all")}
      </Link>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Calendar className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{t("integrations.calendarCategory")}</p>
          <h1 className="text-2xl font-bold tracking-tight">Google Calendar</h1>
        </div>
      </div>
      {workspaceId ? (
        <GoogleCalendarIntegration workspaceId={workspaceId} showHeader={false} />
      ) : (
        <Alert>
          <AlertDescription>
            {t("integrations.selectWorkspaceCalendar")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
