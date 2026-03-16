import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartItemsIndicatorData } from "@/types/dashboard-v2";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ChartDonutWidgetProps {
  title: string;
  description?: string;
  data: ChartItemsIndicatorData;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ChartDonutWidget({
  title,
  description,
  data,
}: ChartDonutWidgetProps) {
  const total = data.items.reduce((acc, item) => acc + item.value, 0);

  const chartData = data.items.map((item) => ({
    name: item.label,
    value: item.value,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(0) : "0",
  }));

  // Valor central (maior item)
  const mainItem = chartData.reduce(
    (a, b) => (a.value > b.value ? a : b),
    chartData[0],
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-1 shrink-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="flex h-full items-center gap-4">
          {/* Donut */}
          <div className="relative flex-shrink-0 w-[140px] h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [val.toLocaleString("pt-BR"), ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Valor central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold">{mainItem?.percentage}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {mainItem?.name?.split(" ")[0]}
              </span>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex-1 space-y-2 min-w-0">
            {chartData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-muted-foreground truncate flex-1">
                  {item.name}
                </span>
                <span className="font-medium tabular-nums text-xs">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
