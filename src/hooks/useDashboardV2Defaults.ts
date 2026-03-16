import { UserRole } from "@/types/auth";
import { WidgetLayout } from "@/types/dashboard-v2";

/**
 * Retorna o layout padrão baseado no role do usuário.
 * Usado quando GET /config retorna null.
 */
export function getDefaultLayoutForRole(role?: UserRole): WidgetLayout[] {
  switch (role) {
    case "SALES_REP":
      return [
        // Linha 1: 4 KPIs
        { indicatorId: "deals.total", x: 0, y: 0, w: 3, h: 2, visible: true },
        { indicatorId: "deals.won", x: 3, y: 0, w: 3, h: 2, visible: true },
        {
          indicatorId: "deals.won_value",
          x: 6,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "chat.new_today",
          x: 9,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        // Linha 2: Donut + Assistentes
        {
          indicatorId: "chat.assistant_vs_human",
          x: 0,
          y: 2,
          w: 6,
          h: 4,
          visible: true,
        },
        {
          indicatorId: "assistants.active",
          x: 6,
          y: 2,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "assistants.total",
          x: 9,
          y: 2,
          w: 3,
          h: 2,
          visible: true,
        },
        // Linha 3: Mensagens + Não lidas
        {
          indicatorId: "messages.new_today",
          x: 0,
          y: 6,
          w: 6,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "chat.unread_total",
          x: 6,
          y: 6,
          w: 6,
          h: 2,
          visible: true,
        },
      ];

    case "WORKSPACE_MANAGER":
    case "WORKSPACE_ADMIN":
    case "WORKSPACE_OWNER":
      return [
        // Linha 1: 4 KPIs (h=2)
        { indicatorId: "deals.total", x: 0, y: 0, w: 3, h: 2, visible: true },
        {
          indicatorId: "deals.won_value",
          x: 3,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "deals.win_rate",
          x: 6,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "deals.avg_value",
          x: 9,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        // Linha 2: Funil (h=7) + Ranking (h=5) + Donut (h=5) empilhados no lado direito
        {
          indicatorId: "deals.pipeline_funnel",
          x: 0,
          y: 2,
          w: 6,
          h: 7,
          visible: true,
        },
        {
          indicatorId: "team.deals_ranking",
          x: 6,
          y: 2,
          w: 6,
          h: 5,
          visible: true,
        },
        {
          indicatorId: "chat.assistant_vs_human",
          x: 6,
          y: 7,
          w: 6,
          h: 5,
          visible: true,
        },
        // Linha 3: Deals por Vendedor (começa após o funil, y=9)
        {
          indicatorId: "deals.by_user",
          x: 0,
          y: 9,
          w: 6,
          h: 4,
          visible: true,
        },
        // Linha 4: KPIs menores (y=13, após o conteúdo mais alto)
        {
          indicatorId: "followup.active",
          x: 0,
          y: 13,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "followup.response_rate",
          x: 3,
          y: 13,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "reengagement.response_rate",
          x: 6,
          y: 13,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "customers.new_today",
          x: 9,
          y: 13,
          w: 3,
          h: 2,
          visible: true,
        },
      ];

    case "COMPANY_OWNER":
    case "COMPANY_ADMIN":
      return [
        // Linha 1: 4 KPIs
        {
          indicatorId: "billing.plan_name",
          x: 0,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "billing.messages_usage",
          x: 3,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "billing.deals_usage",
          x: 6,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "deals.win_rate",
          x: 9,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        // Linha 2: Receita + Esperado
        {
          indicatorId: "deals.won_value",
          x: 0,
          y: 2,
          w: 6,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "deals.expected_revenue",
          x: 6,
          y: 2,
          w: 6,
          h: 2,
          visible: true,
        },
        // Linha 3: Funil + Ranking
        {
          indicatorId: "deals.pipeline_funnel",
          x: 0,
          y: 4,
          w: 6,
          h: 5,
          visible: true,
        },
        {
          indicatorId: "team.deals_ranking",
          x: 6,
          y: 4,
          w: 6,
          h: 5,
          visible: true,
        },
        // Linha 4: Trends
        { indicatorId: "deals.trend", x: 0, y: 9, w: 6, h: 4, visible: true },
        {
          indicatorId: "messages.trend",
          x: 6,
          y: 9,
          w: 6,
          h: 4,
          visible: true,
        },
        // Linha 5: KPIs extras
        {
          indicatorId: "broadcast.total_sent",
          x: 0,
          y: 13,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "followup.active",
          x: 3,
          y: 13,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "reengagement.response_rate",
          x: 6,
          y: 13,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "customers.new_today",
          x: 9,
          y: 13,
          w: 3,
          h: 2,
          visible: true,
        },
      ];

    case "PLATFORM_ADMIN":
      return [
        // Linha 1: 4 KPIs principais
        { indicatorId: "platform.mrr", x: 0, y: 0, w: 3, h: 2, visible: true },
        {
          indicatorId: "platform.total_companies",
          x: 3,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "platform.total_workspaces",
          x: 6,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "platform.total_users",
          x: 9,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        // Linha 2: 4 KPIs secundários
        {
          indicatorId: "platform.total_deals",
          x: 0,
          y: 2,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "platform.total_messages",
          x: 3,
          y: 2,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "followup.total",
          x: 6,
          y: 2,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "broadcast.total",
          x: 9,
          y: 2,
          w: 3,
          h: 2,
          visible: true,
        },
        // Linha 3: Donuts
        {
          indicatorId: "platform.companies_by_plan",
          x: 0,
          y: 4,
          w: 6,
          h: 4,
          visible: true,
        },
        {
          indicatorId: "platform.subscriptions_by_status",
          x: 6,
          y: 4,
          w: 6,
          h: 4,
          visible: true,
        },
      ];

    default:
      // Fallback genérico
      return [
        { indicatorId: "deals.total", x: 0, y: 0, w: 3, h: 2, visible: true },
        { indicatorId: "deals.won", x: 3, y: 0, w: 3, h: 2, visible: true },
        {
          indicatorId: "deals.won_value",
          x: 6,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
        {
          indicatorId: "chat.new_today",
          x: 9,
          y: 0,
          w: 3,
          h: 2,
          visible: true,
        },
      ];
  }
}
