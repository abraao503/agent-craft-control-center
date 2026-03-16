import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLineIndicatorData } from "@/types/dashboard-v2";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChartLineWidgetProps {
  title: string;
  data: ChartLineIndicatorData;
}

export function ChartLineWidget({ title, data }: ChartLineWidgetProps) {
  const chartData = data.labels.map((label, i) => ({
    date: label,
    value: data.datasets[0]?.data[i] ?? 0,
  }));

  const formatXAxis = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd MMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, bottom: 20, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              labelFormatter={(label) => {
                try {
                  return format(
                    parseISO(label as string),
                    "dd 'de' MMM, yyyy",
                    { locale: ptBR },
                  );
                } catch {
                  return label;
                }
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
