import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { KpiIndicatorData } from "@/types/dashboard-v2";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useAppLocale } from "@/i18n/LocaleProvider";

interface KpiCardWidgetProps {
  title: string;
  data: KpiIndicatorData;
  /** Ícone opcional no canto superior direito */
  icon?: LucideIcon;
  /** Cor de destaque: green, red, blue, purple, orange */
  accent?: "green" | "red" | "blue" | "purple" | "orange" | "default";
  /** Texto de variação: ex "+28%", "-5%" */
  changeText?: string;
  /** Texto auxiliar: ex "vs. ontem" */
  changeLabel?: string;
  /** Link opcional */
  linkText?: string;
  onLinkClick?: () => void;
}

const accentStyles: Record<string, string> = {
  green: "border-l-emerald-500",
  red: "border-l-red-500",
  blue: "border-l-blue-500",
  purple: "border-l-violet-500",
  orange: "border-l-orange-500",
  default: "border-l-transparent",
};

export function KpiCardWidget({
  title,
  data,
  icon: Icon,
  accent = "default",
  changeText,
  changeLabel,
  linkText,
  onLinkClick,
}: KpiCardWidgetProps) {
  const { locale } = useAppLocale();
  const isPositive = changeText?.startsWith("+");
  const isNegative = changeText?.startsWith("-");
  const displayValue = data.formatted ?? data.value.toLocaleString(locale);

  return (
    <Card
      className={cn(
        "h-full border-l-4 transition-shadow hover:shadow-md",
        accentStyles[accent],
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="rounded-md bg-muted p-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold tracking-tight">{displayValue}</div>
        <div className="flex items-center justify-between">
          {changeText && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                isPositive && "text-emerald-500",
                isNegative && "text-red-400",
                !isPositive && !isNegative && "text-muted-foreground",
              )}
            >
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {changeText}
              {changeLabel && (
                <span className="text-muted-foreground font-normal">
                  {changeLabel}
                </span>
              )}
            </span>
          )}
          {linkText && (
            <button
              onClick={onLinkClick}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {linkText}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
