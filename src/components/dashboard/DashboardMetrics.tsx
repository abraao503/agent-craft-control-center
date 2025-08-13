import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { DashboardIndicators, getIndicators } from "@/services/dashboard/getIndicators";

const DashboardMetrics = () => {
  const { workspaceId } = useWorkspaceManager();
  
  const { data: indicators, isLoading } = useQuery<DashboardIndicators>({
    queryKey: ["dashboardIndicators", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      
      return getIndicators({
        workspaceId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      });
    },
    enabled: !!workspaceId
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-md font-medium">Agentes</CardTitle>
          <Bot className="w-4 h-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : indicators?.assistants.total || 0}
          </div>
          <p className="text-xs text-green-600">
            {isLoading ? "..." : indicators?.assistants.active || 0} ativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-md font-medium">Conversas</CardTitle>
          <MessageSquare className="w-4 h-4 text-cyan-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : (indicators?.conversations.total || 0).toLocaleString()}
          </div>
          <p className="text-xs text-green-600">
            +{isLoading ? "..." : indicators?.conversations.todayNew || 0} hoje
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-md font-medium">Mensagens</CardTitle>
          <Send className="w-4 h-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : (indicators?.messages.total || 0).toLocaleString()}
          </div>
          <p className="text-xs text-green-600">
            +{isLoading ? "..." : indicators?.messages.todayNew || 0} hoje
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardMetrics;
