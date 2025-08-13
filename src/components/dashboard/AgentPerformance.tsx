import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { AssistantsStatsResponse, getAssistantsStats } from "@/services/dashboard/getAssistantsStats";

const AgentPerformance = () => {
  const navigate = useNavigate();
  const { workspaceId } = useWorkspaceManager();
  
  const { data: assistantsData, isLoading } = useQuery<AssistantsStatsResponse>({
    queryKey: ["assistantsStats", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      
      return getAssistantsStats({ workspaceId });
    },
    enabled: !!workspaceId
  });

  const agents = assistantsData?.assistants || [];
  
  // Show only first 3 agents
  const displayedAgents = agents.slice(0, 3);
  const hasMoreAgents = agents.length > 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Agentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando...</div>
        ) : displayedAgents.length === 0 ? (
          <div className="text-center text-muted-foreground">Nenhum agente encontrado</div>
        ) : (
          displayedAgents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {agent.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h5 className="font-medium">{agent.name}</h5>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{agent.totalConversations} conversas</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={agent.isActive ? "default" : "secondary"}
                  className={
                    agent.isActive
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : ""
                  }
                >
                  {agent.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          ))
        )}

        {hasMoreAgents && (
          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full justify-between text-sm"
              onClick={() => navigate("/agents")}
            >
              <span>Ver todos os agentes ({agents.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentPerformance;
