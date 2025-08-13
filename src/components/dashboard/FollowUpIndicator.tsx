import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Send,
  TrendingUp,
  TrendingDown,
  CheckCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { FollowUpStatsResponse, getFollowUpStats } from "@/services/dashboard/getFollowUpStats";

const FollowUpIndicator = () => {
  const { workspaceId } = useWorkspaceManager();
  
  const { data: followUpStats, isLoading } = useQuery<FollowUpStatsResponse>({
    queryKey: ["followUpStats", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      
      return getFollowUpStats({
        workspaceId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo"
      });
    },
    enabled: !!workspaceId
  });

  const responseRate = followUpStats && followUpStats.messagesThisWeek > 0 
    ? (followUpStats.messagesWithResponse / followUpStats.messagesThisWeek) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Follow-ups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total and Active Follow-ups */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : followUpStats?.total || 0}
            </div>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="text-right">
            <Badge
              variant={
                (followUpStats?.active || 0) > 0 ? "default" : "secondary"
              }
              className="mb-1"
            >
              {isLoading ? "..." : followUpStats?.active || 0} ativos
            </Badge>
          </div>
        </div>

        {/* Weekly Messages Sent */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Mensagens (semana)</span>
            </div>
            <span className="text-lg font-semibold">
              {isLoading ? "..." : followUpStats?.messagesThisWeek || 0}
            </span>
          </div>
        </div>

        {/* Response Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {responseRate >= 55 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : responseRate >= 40 ? (
                <TrendingUp className="w-4 h-4 text-yellow-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">Taxa de resposta</span>
            </div>
            <span className="text-lg font-semibold">
              {isLoading ? "..." : `${responseRate.toFixed(1)}%`}
            </span>
          </div>
          <Progress value={responseRate} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span className="text-sm">
                {isLoading ? "..." : followUpStats?.messagesWithResponse || 0} respostas
              </span>
            </div>
            <span className="text-sm">{isLoading ? "..." : followUpStats?.messagesThisWeek || 0} enviadas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowUpIndicator;
