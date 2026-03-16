import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDashboardCatalog,
  fetchDashboardConfig,
  fetchDashboardIndicators,
  saveDashboardConfig,
  deleteDashboardConfig,
} from "@/services/dashboard-v2";
import {
  CatalogIndicator,
  IndicatorsQueryParams,
  SaveDashboardConfigRequest,
  WidgetLayout,
  PeriodPreset,
} from "@/types/dashboard-v2";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
} from "date-fns";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { getDefaultLayoutForRole } from "@/hooks/useDashboardV2Defaults";
import { useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// ---- Catálogo ----
export function useDashboardCatalog() {
  const { currentWorkspace } = useWorkspaceContext();

  return useQuery({
    queryKey: ["dashboard-v2", "catalog", currentWorkspace?.id],
    queryFn: () => fetchDashboardCatalog(currentWorkspace?.id),
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

// ---- Config ----
export function useDashboardConfig() {
  const { currentWorkspace } = useWorkspaceContext();

  return useQuery({
    queryKey: ["dashboard-v2", "config", currentWorkspace?.id],
    queryFn: () => fetchDashboardConfig(currentWorkspace?.id),
    staleTime: 5 * 60 * 1000,
  });
}

// ---- Save config ----
export function useSaveDashboardConfig(options?: { hideToast?: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (body: SaveDashboardConfigRequest) => saveDashboardConfig(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2", "config"] });
      if (!options?.hideToast) {
        toast({
          title: "Dashboard salva",
          description: "Suas alterações foram salvas com sucesso.",
        });
      }
    },
    onError: () => {
      if (!options?.hideToast) {
        toast({
          title: "Erro",
          description: "Não foi possível salvar a configuração.",
          variant: "destructive",
        });
      }
    },
  });
}

// ---- Reset config ----
export function useResetDashboardConfig() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => deleteDashboardConfig(currentWorkspace?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2", "config"] });
      toast({
        title: "Dashboard restaurada",
        description: "Layout padrão restaurado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível restaurar o layout.",
        variant: "destructive",
      });
    },
  });
}

// ---- Helpers ----
export function getPeriodDates(preset: PeriodPreset): {
  startDate?: string;
  endDate?: string;
} {
  const now = new Date();
  switch (preset) {
    case "today":
      return {
        startDate: startOfDay(now).toISOString(),
        endDate: now.toISOString(),
      };
    case "yesterday":
      return {
        startDate: startOfDay(subDays(now, 1)).toISOString(),
        endDate: endOfDay(subDays(now, 1)).toISOString(),
      };
    case "last_7_days":
      return {
        startDate: subDays(now, 7).toISOString(),
        endDate: now.toISOString(),
      };
    case "last_30_days":
      return {
        startDate: subDays(now, 30).toISOString(),
        endDate: now.toISOString(),
      };
    case "this_month":
      return {
        startDate: startOfMonth(now).toISOString(),
        endDate: now.toISOString(),
      };
    case "last_month":
      return {
        startDate: startOfMonth(subMonths(now, 1)).toISOString(),
        endDate: endOfMonth(subMonths(now, 1)).toISOString(),
      };
    case "this_quarter":
      return {
        startDate: startOfQuarter(now).toISOString(),
        endDate: now.toISOString(),
      };
    default:
      return {};
  }
}

// ---- Indicators ----
export function useDashboardIndicators(
  indicatorIds: string[],
  period: PeriodPreset = "last_30_days",
  enabled: boolean = true,
) {
  const { currentWorkspace } = useWorkspaceContext();

  const { startDate, endDate } = useMemo(
    () => getPeriodDates(period),
    [period],
  );

  const params: IndicatorsQueryParams = {
    workspaceId: currentWorkspace?.id ?? "",
    indicators: indicatorIds.join(","),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };

  return useQuery({
    queryKey: ["dashboard-v2", "indicators", params],
    queryFn: () => fetchDashboardIndicators(params),
    enabled: enabled && indicatorIds.length > 0 && !!currentWorkspace?.id,
    staleTime: 2 * 60 * 1000, // 2 min
    refetchInterval: 60 * 1000, // Refetch a cada 60s
  });
}

// ---- Hook principal: resolve layout ----
export function useDashboardV2(period: PeriodPreset = "last_30_days") {
  const { role } = usePermissions();
  const { data: configData, isLoading: configLoading } = useDashboardConfig();
  const { data: catalogData, isLoading: catalogLoading } =
    useDashboardCatalog();

  // Resolve o layout: config salva > layout padrão por role
  const activeWidgets: WidgetLayout[] = useMemo(() => {
    if (configData?.config?.layout?.widgets) {
      return configData.config.layout.widgets.filter((w) => w.visible);
    }
    return getDefaultLayoutForRole(role);
  }, [configData, role]);

  // IDs de indicadores ativos
  const activeIndicatorIds = useMemo(
    () => activeWidgets.map((w) => w.indicatorId),
    [activeWidgets],
  );

  // Mapa de indicadores do catálogo para lookup rápido
  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogIndicator>();
    if (catalogData?.categories) {
      for (const cat of catalogData.categories) {
        for (const ind of cat.indicators) {
          map.set(ind.id, ind);
        }
      }
    }
    return map;
  }, [catalogData]);

  // Buscar dados dos indicadores
  const { data: indicatorsData, isLoading: indicatorsLoading } =
    useDashboardIndicators(activeIndicatorIds, period);

  const hasCustomConfig = !!configData?.config;

  // Helper para obter o nome de um indicador
  const getIndicatorName = useCallback(
    (id: string) => catalogMap.get(id)?.name ?? id,
    [catalogMap],
  );

  // Helper para obter o tipo de widget de um indicador
  const getWidgetType = useCallback(
    (id: string) => catalogMap.get(id)?.widgetType ?? "kpi_card",
    [catalogMap],
  );

  return {
    activeWidgets,
    activeIndicatorIds,
    indicatorsData: indicatorsData?.indicators ?? {},
    catalogData,
    catalogMap,
    isLoading: configLoading || catalogLoading,
    indicatorsLoading,
    hasCustomConfig,
    getIndicatorName,
    getWidgetType,
  };
}
