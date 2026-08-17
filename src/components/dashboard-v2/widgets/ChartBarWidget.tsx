import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartItemsIndicatorData } from "@/types/dashboard-v2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";

interface ChartBarWidgetProps {
  title: string;
  data: ChartItemsIndicatorData;
  /** Se true, barras horizontais */
  horizontal?: boolean;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ChartBarWidget({
  title,
  data,
  horizontal = true,
}: ChartBarWidgetProps) {
  const { t } = useTranslation();
  const chartData = data.items.map((item) => ({
    name: item.label,
    value: item.value,
  }));

  function formatTextValue(value: number) {
    if (value >= 1000) {
      return `${value / 1000}k ${t("dashboard.deals")}`;
    }

    if (value === 1) {
      return `${value} ${t("dashboard.deal")}`;
    }

    return `${value} ${t("dashboard.deals")}`;
  }

  // Para barras horizontais (como o funil da mockup)
  if (horizontal) {
    const maxVal = Math.max(...chartData.map((d) => d.value));

    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-3">
          {chartData.map((item, i) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[60%]">
                  {item.name}
                </span>
                <span className="font-medium tabular-nums">
                  {formatTextValue(item.value)}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / maxVal) * 100}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Barras verticais
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 20, left: 0 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
