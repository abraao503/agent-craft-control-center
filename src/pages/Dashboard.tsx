import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import DashboardCards from "@/components/dashboard/DashboardCards";
import RecentAgents from "@/components/dashboard/RecentAgents";
import WhatsAppOverview from "@/components/dashboard/WhatsAppOverview";
import QuickActions from "@/components/dashboard/QuickActions";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth/hooks";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
        </div>
        <Link to="/agents/new">
          <Button>
            <Plus className="mr-2 h-5 w-5" />
            New Agent
          </Button>
        </Link>
      </div>

      <DashboardCards />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RecentAgents />
        <div className="md:col-span-1">
          <div className="space-y-4">
            <WhatsAppOverview />
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
