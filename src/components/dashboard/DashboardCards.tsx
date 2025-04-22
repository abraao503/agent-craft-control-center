import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, Activity, Users } from 'lucide-react';
import { AGENTS, WHATSAPP_INTEGRATIONS } from '@/services/mockData';

const DashboardCards = () => {
  const totalAgents = AGENTS.length;
  const totalIntegrations = WHATSAPP_INTEGRATIONS.length;
  
  // Placeholder metrics for the demo
  const totalMessages = 145;
  const activeUsers = 32;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          <Bot className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAgents}</div>
          <p className="text-xs text-muted-foreground">
            +{Math.floor(Math.random() * 5) + 1} from last month
          </p>
          <div className="mt-3">
            <Link to="/agents">
              <Button variant="outline" size="sm" className="w-full">
                View Agents
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">WhatsApp Integrations</CardTitle>
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalIntegrations}</div>
          <p className="text-xs text-muted-foreground">
            +{Math.floor(Math.random() * 5) + 1} from last month
          </p>
          <div className="mt-3">
            <Link to="/integrations">
              <Button variant="outline" size="sm" className="w-full">
                View Integrations
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Messages Handled</CardTitle>
          <Activity className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMessages}</div>
          <p className="text-xs text-muted-foreground">
            +{Math.floor(Math.random() * 20) + 10} from yesterday
          </p>
          <div className="mt-3">
            <Button variant="outline" size="sm" className="w-full" disabled>
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            +{Math.floor(Math.random() * 10) + 5} from last week
          </p>
          <div className="mt-3">
            <Button variant="outline" size="sm" className="w-full" disabled>
              View Users
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCards;
