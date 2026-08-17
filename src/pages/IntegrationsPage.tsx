import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Facebook, Settings2 } from "lucide-react";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { useTranslation } from "react-i18next";

type IntegrationItemProps = {
  to: string;
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  description: string;
};

function IntegrationItem({
  to,
  icon,
  iconClassName,
  title,
  description,
}: IntegrationItemProps) {
  return (
    <Link
      to={to}
      className="group flex min-w-0 items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
      <ArrowRight
        className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground"
        aria-hidden="true"
      />
    </Link>
  );
}

export default function IntegrationsPage() {
  const { workspaceId } = useWorkspaceManager();
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("integrations.title")}</h1>
        <p className="max-w-2xl text-muted-foreground">
          {t("integrations.description")}
        </p>
      </header>

      <section aria-labelledby="integrations-list-title" className="space-y-3">
        <div>
          <h2 id="integrations-list-title" className="text-lg font-semibold">
            {t("integrations.availableTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("integrations.availableDescription")}
          </p>
        </div>

        <div className="grid gap-3">
          <IntegrationItem
            to="/integrations/meta"
            icon={<Facebook className="h-5 w-5" aria-hidden="true" />}
            iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            title="Meta Ads e Lead Ads"
            description={t("integrations.metaDescription")}
          />
          {workspaceId && (
            <IntegrationItem
              to="/integrations/google-calendar"
              icon={<Calendar className="h-5 w-5" aria-hidden="true" />}
              iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              title="Google Calendar"
              description={t("integrations.calendarDescription")}
            />
          )}
        </div>
      </section>
    </div>
  );
}
