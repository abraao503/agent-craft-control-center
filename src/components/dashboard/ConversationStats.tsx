import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Bot, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { ConversationsStatsResponse, getConversationsStats } from "@/services/dashboard/getConversationsStats";

const ConversationStats = () => {
  const { workspaceId } = useWorkspaceManager();
  
  const { data: stats, isLoading } = useQuery<ConversationsStatsResponse>({
    queryKey: ["conversationsStats", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      
      return getConversationsStats({ workspaceId });
    },
    enabled: !!workspaceId
  });

  const aiPercentage = stats ? (stats.handledByAssistant / stats.total) * 100 : 0;
  const humanPercentage = stats ? (stats.handledByHuman / stats.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Conversas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 ">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-sm">IA</span>
            </div>
            <span className="text-sm font-medium">
              {isLoading ? "..." : `${aiPercentage.toFixed(1)}%`}
            </span>
          </div>
          <Progress value={aiPercentage} className="h-2" />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              <span className="text-sm">Humano</span>
            </div>
            <span className="text-sm font-medium">
              {isLoading ? "..." : `${humanPercentage.toFixed(1)}%`}
            </span>
          </div>
          <Progress value={humanPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationStats;
