import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableIndicatorData } from "@/types/dashboard-v2";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppLocale } from "@/i18n/LocaleProvider";
import { useTranslation } from "react-i18next";

interface TableWidgetProps {
  title: string;
  indicatorId: string;
  data: TableIndicatorData;
}

/**
 * Renderiza tabela de dados conforme o indicador.
 * Layout muda dependendo do tipo de dado (ranking, broadcasts, etc.)
 */
export function TableWidget({ title, indicatorId, data }: TableWidgetProps) {
  // Ranking de vendedores
  if (indicatorId === "team.deals_ranking") {
    return <RankingTable title={title} data={data} />;
  }

  // Campanhas recentes
  if (indicatorId === "broadcast.recent") {
    return <BroadcastTable title={title} data={data} />;
  }

  // Tabela genérica
  return <GenericTable title={title} data={data} />;
}

// ---- Ranking de Vendedores (inspirado na mockup) ----
function RankingTable({
  title,
  data,
}: {
  title: string;
  data: TableIndicatorData;
}) {
  const { locale } = useAppLocale();
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              <th className="text-left pb-2 font-medium">POS</th>
              <th className="text-left pb-2 font-medium">VENDEDOR</th>
              <th className="text-right pb-2 font-medium">{locale === "es-ES" ? "GANADOS" : "GANHOS"}</th>
              <th className="text-right pb-2 font-medium">{locale === "es-ES" ? "OBJETIVO" : "META"}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => {
              const name = item.name as string;
              const value = item.value as number;
              const dealsWon = item.deals_won as number;
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              // Meta fictícia de progresso
              const metaPct = Math.min(100, Math.round((dealsWon / 15) * 100));

              return (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-2.5 text-muted-foreground font-medium">
                    #{i + 1}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums">
                    {value.toLocaleString(locale, { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={
                        metaPct >= 80
                          ? "text-emerald-500"
                          : metaPct >= 50
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                      }
                    >
                      {metaPct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ---- Tabela de broadcasts recentes ----
function BroadcastTable({
  title,
  data,
}: {
  title: string;
  data: TableIndicatorData;
}) {
  const { locale } = useAppLocale();
  const { t } = useTranslation();
  const statusColor: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-500",
    SENDING: "bg-blue-500/10 text-blue-500",
    SCHEDULED: "bg-yellow-500/10 text-yellow-500",
    FAILED: "bg-red-500/10 text-red-500",
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-3">
          {data.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{item.name as string}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.sentCount as number).toLocaleString(locale)} {t("dashboard.sent")}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={statusColor[item.status as string] ?? ""}
              >
                {item.status as string}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Tabela genérica ----
function GenericTable({
  title,
  data,
}: {
  title: string;
  data: TableIndicatorData;
}) {
  if (!data.items.length) return null;

  const columns = Object.keys(data.items[0]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs">
              {columns.map((col) => (
                <th key={col} className="text-left pb-2 font-medium capitalize">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className="border-b last:border-b-0">
                {columns.map((col) => (
                  <td key={col} className="py-2 text-sm">
                    {String(item[col] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
