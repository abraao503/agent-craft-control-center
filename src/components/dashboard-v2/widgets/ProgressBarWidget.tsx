import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { KpiIndicatorData } from "@/types/dashboard-v2";
import { useTranslation } from "react-i18next";

interface ProgressBarWidgetProps {
  title: string;
  data: KpiIndicatorData;
  /** Cor: green, yellow, red, blue */
  color?: "green" | "yellow" | "red" | "blue" | "default";
}

export function ProgressBarWidget({
  title,
  data,
  color = "default",
}: ProgressBarWidgetProps) {
  const { t } = useTranslation();
  const pct = Math.min(100, Math.max(0, data.value));
  const displayValue = data.formatted ?? `${pct}%`;

  // Cor automática baseada no uso
  const autoColor = pct >= 90 ? "red" : pct >= 70 ? "yellow" : "green";
  const finalColor = color === "default" ? autoColor : color;

  const colorClasses: Record<string, string> = {
    green: "[&>div]:bg-emerald-500",
    yellow: "[&>div]:bg-yellow-500",
    red: "[&>div]:bg-red-500",
    blue: "[&>div]:bg-blue-500",
  };

  const textColors: Record<string, string> = {
    green: "text-emerald-500",
    yellow: "text-yellow-500",
    red: "text-red-500",
    blue: "text-blue-500",
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          <span className={`text-xs font-medium ${textColors[finalColor]}`}>
            {displayValue}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">{displayValue}</div>
        <Progress value={pct} className={`h-2 ${colorClasses[finalColor]}`} />
        <p className="text-xs text-muted-foreground">
          {pct >= 90
            ? t("dashboard.nearLimit")
            : pct >= 70
              ? t("dashboard.moderateUsage")
              : t("dashboard.healthyUsage")}
        </p>
      </CardContent>
    </Card>
  );
}
