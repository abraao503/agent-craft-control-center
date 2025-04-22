
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Robot, MessageSquare, Settings, MessageCircleQuestion } from 'lucide-react';

const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and helpful resources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/agents/new">
            <Button variant="outline" className="w-full justify-start">
              <Robot className="mr-2 h-5 w-5" />
              Create Agent
            </Button>
          </Link>
          
          <Link to="/integrations/new">
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="mr-2 h-5 w-5" />
              Connect WhatsApp
            </Button>
          </Link>
          
          <Link to="/settings">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
          </Link>
          
          <Button variant="outline" className="w-full justify-start" disabled>
            <MessageCircleQuestion className="mr-2 h-5 w-5" />
            Help Center
          </Button>
        </div>
        
        <div className="bg-primary/5 p-4 rounded-lg mt-4">
          <h4 className="font-medium mb-2">Need assistance?</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Our support team can help you set up your AI agents and connect them to WhatsApp.
          </p>
          <Button variant="default" size="sm" disabled>
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
