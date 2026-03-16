import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelIndicatorData } from "@/types/dashboard-v2";

interface FunnelWidgetProps {
  title: string;
  data: FunnelIndicatorData;
}

/**
 * Paleta fixa de cores para os estágios do funil.
 * Usa a cor primária do tema (--primary: 262 83% 58%) com lightness variada
 * para dar um degradê sutil entre os estágios.
 */
const STAGE_COLORS = [
  "hsl(262 83% 55%)",
  "hsl(262 78% 58%)",
  "hsl(262 72% 62%)",
  "hsl(262 65% 66%)",
  "hsl(262 58% 70%)",
  "hsl(262 50% 74%)",
  "hsl(262 42% 78%)",
];

export function FunnelWidget({ title, data }: FunnelWidgetProps) {
  const maxCount = Math.max(...data.stages.map((s) => s.count), 1);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-1 shrink-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4 pb-3 flex-1 min-h-0 overflow-y-auto">
        {data.stages.map((stage, i) => {
          const widthPct = Math.max((stage.count / maxCount) * 100, 6);
          const conversionRate =
            i > 0 && data.stages[i - 1].count > 0
              ? ((stage.count / data.stages[i - 1].count) * 100).toFixed(0)
              : null;
          const color = STAGE_COLORS[i % STAGE_COLORS.length];

          return (
            <div key={stage.name} className="flex flex-col gap-0.5 shrink-0">
              {/* Label do estágio + taxa de conversão + contagem */}
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground truncate">
                  {stage.name}
                </span>
                <div className="flex items-baseline gap-2 shrink-0 ml-2">
                  {conversionRate !== null && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      ↓ {conversionRate}%
                    </span>
                  )}
                  <span className="text-sm font-bold tabular-nums">
                    {stage.count}
                  </span>
                </div>
              </div>

              {/* Barra horizontal proporcional — alinhada à esquerda */}
              <div className="w-full h-5 rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-700 ease-out"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
