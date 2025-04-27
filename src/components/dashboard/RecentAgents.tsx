
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus } from 'lucide-react';
import { AGENTS } from '@/services/mockData';

const RecentAgents = () => {
  // Sort agents by creation date (newest first) and take the first 5
  const recentAgents = [...AGENTS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Recent Agents</CardTitle>
          <CardDescription>
            Your most recently created AI agents
          </CardDescription>
        </div>
        <Link to="/agents/new">
          <Button className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Agent
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recentAgents.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              You haven't created any agents yet
            </p>
            <Link to="/agents/new">
              <Button>Create Your First Agent</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAgents.map(agent => (
              <div 
                key={agent.id}
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(agent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">
                    {agent.iaModelName}
                  </Badge>
                  <Link to={`/agents/${agent.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            <div className="text-center pt-2">
              <Link to="/agents">
                <Button variant="outline">View All Agents</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentAgents;
