import {
  IndicatorData,
  WidgetType,
  isKpiData,
  isChartItemsData,
  isChartLineData,
  isFunnelData,
  isTableData,
  KpiIndicatorData,
  ChartItemsIndicatorData,
  ChartLineIndicatorData,
  FunnelIndicatorData,
  TableIndicatorData,
} from "@/types/dashboard-v2";
import { KpiCardWidget } from "./KpiCardWidget";
import { ChartBarWidget } from "./ChartBarWidget";
import { ChartLineWidget } from "./ChartLineWidget";
import { ChartDonutWidget } from "./ChartDonutWidget";
import { FunnelWidget } from "./FunnelWidget";
import { TableWidget } from "./TableWidget";
import { ProgressBarWidget } from "./ProgressBarWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  DollarSign,
  TrendingUp,
  Trophy,
  Target,
  MessageSquare,
  Users,
  Building2,
  BarChart3,
  Bot,
  Mail,
  UserCheck,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface WidgetRendererProps {
  indicatorId: string;
  indicatorName: string;
  widgetType: WidgetType;
  data: IndicatorData | undefined;
  isLoading: boolean;
}

// Mapeamento de ícones por indicador
const INDICATOR_ICONS: Record<string, LucideIcon> = {
  "deals.total": BarChart3,
  "deals.total_value": DollarSign,
  "deals.won": Trophy,
  "deals.won_value": DollarSign,
  "deals.lost": Target,
  "deals.win_rate": TrendingUp,
  "deals.avg_value": DollarSign,
  "deals.new_today": Zap,
  "chat.total": MessageSquare,
  "chat.new_today": MessageSquare,
  "chat.unread_total": Mail,
  "messages.new_today": MessageSquare,
  "messages.total": MessageSquare,
  "assistants.total": Bot,
  "assistants.active": Bot,
  "followup.active": Zap,
  "followup.response_rate": TrendingUp,
  "reengagement.response_rate": TrendingUp,
  "customers.new_today": UserCheck,
  "customers.total": Users,
  "team.total_users": Users,
  "platform.total_companies": Building2,
  "platform.total_workspaces": BarChart3,
  "platform.total_users": Users,
  "platform.mrr": DollarSign,
  "broadcast.total_sent": Mail,
};

// Mapeamento de acentos por indicador
const INDICATOR_ACCENTS: Record<
  string,
  "green" | "red" | "blue" | "purple" | "orange"
> = {
  "deals.won": "green",
  "deals.won_value": "green",
  "deals.lost": "red",
  "deals.lost_value": "red",
  "deals.win_rate": "green",
  "chat.new_today": "blue",
  "chat.unread_total": "red",
  "platform.mrr": "green",
  "platform.total_companies": "blue",
  "platform.total_workspaces": "purple",
  "platform.total_users": "orange",
};

// Mock de variações
const INDICATOR_CHANGES: Record<string, { text: string; label?: string }> = {
  "deals.total": { text: "+6%", label: "vs mês" },
  "deals.won": { text: "+28%" },
  "deals.won_value": { text: "+15%" },
  "deals.win_rate": { text: "+3.2pp" },
  "deals.avg_value": { text: "-12%" },
  "deals.new_today": { text: "+ 3 novo" },
  "chat.new_today": { text: "0%" },
  "messages.new_today": { text: "+12%", label: "vs. ontem" },
  "platform.mrr": { text: "+5.2%", label: "vs last month" },
  "platform.total_companies": { text: "+2 new companies" },
  "platform.total_workspaces": { text: "+8 active slots" },
  "platform.total_users": { text: "+12%", label: "growth rate" },
  "platform.total_deals": { text: "+15%", label: "vs avg" },
  "platform.total_messages": { text: "-2.6%", label: "vs peak" },
  "followup.active": { text: "+90% automation" },
  "broadcast.total_sent": { text: "+5% campaigns" },
  "customers.new_today": { text: "+67" },
};

export function WidgetRenderer({
  indicatorId,
  indicatorName,
  widgetType,
  data,
  isLoading,
}: WidgetRendererProps) {
  if (isLoading) {
    return (
      <Card className="h-full w-full flex items-center justify-center">
        <CardContent className="py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const icon = INDICATOR_ICONS[indicatorId];
  const accent = INDICATOR_ACCENTS[indicatorId];
  const change = INDICATOR_CHANGES[indicatorId];

  if (!data) {
    if (widgetType === "kpi_card") {
      return (
        <KpiCardWidget
          title={indicatorName}
          data={{ value: 0 }}
          icon={icon}
          accent={accent}
          changeText={change?.text}
          changeLabel={change?.label}
        />
      );
    }

    if (widgetType === "progress_bar") {
      return <ProgressBarWidget title={indicatorName} data={{ value: 0 }} />;
    }

    const Icon = icon;
    return (
      <Card className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
        {Icon && <Icon className="h-8 w-8 text-muted-foreground/30 mb-3" />}
        <h3 className="text-sm font-medium">{indicatorName}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Sem dados no período
        </p>
      </Card>
    );
  }

  switch (widgetType) {
    case "kpi_card":
      if (isKpiData(data)) {
        return (
          <KpiCardWidget
            title={indicatorName}
            data={data as KpiIndicatorData}
            icon={icon}
            accent={accent}
            changeText={change?.text}
            changeLabel={change?.label}
          />
        );
      }
      break;

    case "progress_bar":
      if (isKpiData(data)) {
        return (
          <ProgressBarWidget
            title={indicatorName}
            data={data as KpiIndicatorData}
          />
        );
      }
      break;

    case "chart_bar":
      if (isChartItemsData(data)) {
        return (
          <ChartBarWidget
            title={indicatorName}
            data={data as ChartItemsIndicatorData}
          />
        );
      }
      break;

    case "chart_line":
      if (isChartLineData(data)) {
        return (
          <ChartLineWidget
            title={indicatorName}
            data={data as ChartLineIndicatorData}
          />
        );
      }
      break;

    case "chart_donut":
      if (isChartItemsData(data)) {
        return (
          <ChartDonutWidget
            title={indicatorName}
            data={data as ChartItemsIndicatorData}
          />
        );
      }
      break;

    case "funnel":
      if (isFunnelData(data)) {
        return (
          <FunnelWidget
            title={indicatorName}
            data={data as FunnelIndicatorData}
          />
        );
      }
      break;

    case "table":
      if (isTableData(data)) {
        return (
          <TableWidget
            title={indicatorName}
            indicatorId={indicatorId}
            data={data as TableIndicatorData}
          />
        );
      }
      break;
  }

  // Fallback
  return (
    <Card className="h-full w-full flex items-center justify-center">
      <CardContent className="py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Widget "{widgetType}" — {indicatorName}
        </p>
      </CardContent>
    </Card>
  );
}
