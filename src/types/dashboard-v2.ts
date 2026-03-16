// ============================================================
// Dashboard V2 — Types
// ============================================================

/** Tipos de widget suportados */
export type WidgetType =
  | "kpi_card"
  | "chart_bar"
  | "chart_line"
  | "chart_donut"
  | "funnel"
  | "table"
  | "progress_bar";

export type IndicatorPriority = "primary" | "secondary";

export type IndicatorScope = "workspace" | "company" | "platform";

export type PeriodPreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "custom";

// ---- Catálogo ----

export interface CatalogIndicator {
  id: string;
  name: string;
  description: string;
  widgetType: WidgetType;
  priority: IndicatorPriority;
  supportsPeriod: boolean;
  scope: IndicatorScope;
}

export interface CatalogCategory {
  id: string;
  name: string;
  indicators: CatalogIndicator[];
}

export interface CatalogResponse {
  categories: CatalogCategory[];
}

// ---- Config (Layout do Usuário) ----

export interface WidgetConfig {
  period?: string;
  pipelineId?: string;
  chartType?: string;
}

export interface WidgetLayout {
  indicatorId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
  config?: WidgetConfig;
}

export interface DashboardLayout {
  widgets: WidgetLayout[];
}

export interface DashboardConfig {
  id: string;
  layout: DashboardLayout;
}

export interface DashboardConfigResponse {
  config: DashboardConfig | null;
}

export interface SaveDashboardConfigRequest {
  workspaceId?: string;
  layout: DashboardLayout;
}

// ---- Indicators (Dados) ----

/** Resposta de KPI / Progress Bar */
export interface KpiIndicatorData {
  value: number;
  formatted?: string;
}

/** Resposta de chart_bar / chart_donut */
export interface ChartItemsIndicatorData {
  items: Array<{
    label: string;
    value: number;
  }>;
}

/** Resposta de chart_line */
export interface ChartLineIndicatorData {
  labels: string[];
  datasets: Array<{
    data: number[];
  }>;
}

/** Resposta de funnel */
export interface FunnelIndicatorData {
  stages: Array<{
    name: string;
    count: number;
    value: number;
  }>;
}

/** Resposta de table */
export interface TableIndicatorData {
  items: Array<Record<string, unknown>>;
}

export type IndicatorData =
  | KpiIndicatorData
  | ChartItemsIndicatorData
  | ChartLineIndicatorData
  | FunnelIndicatorData
  | TableIndicatorData;

export interface IndicatorsResponse {
  indicators: Record<string, IndicatorData>;
  meta: {
    cachedAt: string;
    period: {
      start: string;
      end: string;
    };
  };
}

export interface IndicatorsQueryParams {
  workspaceId: string;
  indicators: string;
  timezone?: string;
  startDate?: string;
  endDate?: string;
  pipelineId?: string;
}

// ---- Helpers de tipo guard ----

export function isKpiData(data: IndicatorData): data is KpiIndicatorData {
  return (
    "value" in data &&
    !("items" in data) &&
    !("stages" in data) &&
    !("labels" in data)
  );
}

export function isChartItemsData(
  data: IndicatorData,
): data is ChartItemsIndicatorData {
  return (
    "items" in data &&
    Array.isArray((data as ChartItemsIndicatorData).items) &&
    (data as ChartItemsIndicatorData).items.length > 0 &&
    "label" in (data as ChartItemsIndicatorData).items[0]
  );
}

export function isChartLineData(
  data: IndicatorData,
): data is ChartLineIndicatorData {
  return "labels" in data && "datasets" in data;
}

export function isFunnelData(data: IndicatorData): data is FunnelIndicatorData {
  return "stages" in data;
}

export function isTableData(data: IndicatorData): data is TableIndicatorData {
  return "items" in data && !isChartItemsData(data);
}
