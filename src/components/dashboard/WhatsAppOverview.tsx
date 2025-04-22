
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { WHATSAPP_INTEGRATIONS, AGENTS } from '@/services/mockData';

const WhatsAppOverview = () => {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">WhatsApp Integrations</CardTitle>
          <CardDescription>
            Your connected WhatsApp numbers
          </CardDescription>
        </div>
        <Link to="/integrations/new">
          <Button variant="outline" className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {WHATSAPP_INTEGRATIONS.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              No WhatsApp integrations yet
            </p>
            <Link to="/integrations/new">
              <Button>Connect WhatsApp</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {WHATSAPP_INTEGRATIONS.map(integration => {
              const agent = AGENTS.find(a => a.id === integration.agentId);
              const statusColor = 
                integration.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                integration.status === 'inactive' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
                
              return (
                <div 
                  key={integration.id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{integration.name}</h4>
                    <Badge className={statusColor}>
                      {integration.status}
                    </Badge>
                  </div>
                  <p className="text-sm">{integration.phoneNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Connected to: <span className="font-medium">{agent?.name || 'Unknown'}</span>
                  </p>
                </div>
              );
            })}
            
            <div className="text-center pt-2">
              <Link to="/integrations">
                <Button variant="outline" size="sm">View All Integrations</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppOverview;
