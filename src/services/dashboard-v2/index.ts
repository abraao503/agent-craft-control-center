import {
  CatalogResponse,
  DashboardConfig,
  DashboardConfigResponse,
  IndicatorsResponse,
  IndicatorsQueryParams,
  SaveDashboardConfigRequest,
} from "@/types/dashboard-v2";
import { api } from "@/services/api";

/**
 * GET /dashboard/v2/catalog
 * Retorna o catálogo de indicadores disponíveis para o usuário.
 */
export async function fetchDashboardCatalog(
  workspaceId?: string,
): Promise<CatalogResponse> {
  const { data } = await api.get<CatalogResponse>("/dashboard/v2/catalog", {
    params: { workspaceId },
  });
  return data;
}

/**
 * GET /dashboard/v2/config
 * Retorna a configuração de layout salva pelo usuário (ou null).
 *
 * A API retorna diretamente { id, layout } (ou 204/null quando não há config),
 * então mapeamos para o shape esperado pelo front: { config: DashboardConfig | null }.
 */
export async function fetchDashboardConfig(
  workspaceId?: string,
): Promise<DashboardConfigResponse> {
  const { data } = await api.get<DashboardConfig | null>(
    "/dashboard/v2/config",
    {
      params: { workspaceId },
    },
  );

  // API retorna { id, layout: { widgets } } diretamente ou null
  if (data && data.layout?.widgets) {
    return { config: data };
  }

  return { config: null };
}

/**
 * PUT /dashboard/v2/config
 * Salva a configuração de layout do usuário.
 */
export async function saveDashboardConfig(
  body: SaveDashboardConfigRequest,
): Promise<{ id: string }> {
  const { data } = await api.put<{ id: string }>("/dashboard/v2/config", body);
  return data;
}

/**
 * DELETE /dashboard/v2/config
 * Reseta a configuração do usuário.
 */
export async function deleteDashboardConfig(
  workspaceId?: string,
): Promise<null> {
  await api.delete("/dashboard/v2/config", {
    params: { workspaceId },
  });
  return null;
}

/**
 * GET /dashboard/v2/indicators
 * Retorna os dados dos indicadores solicitados.
 */
export async function fetchDashboardIndicators(
  params: IndicatorsQueryParams,
): Promise<IndicatorsResponse> {
  const { data } = await api.get<{
    results?: Record<string, unknown>;
    indicators?: Record<string, unknown>;
    meta?: IndicatorsResponse["meta"];
  }>("/dashboard/v2/indicators", {
    params,
  });
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    indicators: (data.results || data.indicators || {}) as any,
    meta: data.meta || { period: { start: "", end: "" }, cachedAt: "" },
  };
}
