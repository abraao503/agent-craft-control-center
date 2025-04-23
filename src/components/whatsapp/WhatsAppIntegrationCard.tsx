
import { WhatsAppIntegration } from '@/types/whatsapp';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Copy, Webhook } from 'lucide-react';
import { AGENTS } from '@/services/mockData';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppIntegrationCardProps {
  integration: WhatsAppIntegration;
  onDelete: (id: string) => void;
}

const WhatsAppIntegrationCard = ({ integration, onDelete }: WhatsAppIntegrationCardProps) => {
  const agent = AGENTS.find(a => a.id === integration.agentId);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'inactive':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'twilio':
        return 'Twilio';
      case 'zapi':
        return 'Z-API';
      default:
        return 'Other';
    }
  };

  const copyWebhookToClipboard = () => {
    if (integration.webhookUrl) {
      navigator.clipboard.writeText(integration.webhookUrl);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The webhook URL has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{integration.name}</CardTitle>
          <Badge className={getStatusColor(integration.status)}>
            {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
          </Badge>
        </div>
        <CardDescription>
          Connected to: {agent?.name || 'Unknown Agent'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Phone:</span>{' '}
            {integration.phoneNumber}
          </p>
          <p>
            <span className="font-medium text-foreground">Provider:</span>{' '}
            {getProviderLabel(integration.provider)}
          </p>
          <p>
            <span className="font-medium text-foreground">Created:</span>{' '}
            {new Date(integration.createdAt).toLocaleDateString()}
          </p>
          
          {integration.provider === 'zapi' && integration.webhookUrl && (
            <div className="pt-2">
              <div className="flex items-center gap-1 mb-1">
                <Webhook className="h-3 w-3" />
                <span className="font-medium text-foreground">Webhook URL:</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="truncate text-xs font-mono bg-gray-50 p-1 rounded border flex-grow">
                  {integration.webhookUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-6 w-6 p-0"
                  onClick={copyWebhookToClipboard}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(integration.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppIntegrationCard;
