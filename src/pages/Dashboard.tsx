import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import ConversationStats from "@/components/dashboard/ConversationStats";
import AgentPerformance from "@/components/dashboard/AgentPerformance";
import FollowUpIndicator from "@/components/dashboard/FollowUpIndicator";
import { Plus, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth/hooks";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user?.name}!
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/settings">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </Link>
          <Link to="/agents/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agente
            </Button>
          </Link>
        </div>
      </div>

      {/* Métricas principais */}
      <DashboardMetrics />

      {/* Segunda linha: Conversas, Agentes e Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AgentPerformance />
        <ConversationStats />
        <FollowUpIndicator />
      </div>
    </div>
  );
};

export default Dashboard;
