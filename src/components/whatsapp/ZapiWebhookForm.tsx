
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Webhook, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ZapiWebhookFormProps {
  instanceApi: string;
  token: string;
  webhookUrl: string | undefined;
  onGenerateWebhook: (instanceApi: string, token: string) => string;
  onSave: () => void;
}

const ZapiWebhookForm = ({ 
  instanceApi, 
  token, 
  webhookUrl, 
  onGenerateWebhook, 
  onSave 
}: ZapiWebhookFormProps) => {
  const [localInstanceApi, setLocalInstanceApi] = useState(instanceApi);
  const [localToken, setLocalToken] = useState(token);
  const [generatedWebhook, setGeneratedWebhook] = useState(webhookUrl || '');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerateWebhook = () => {
    if (!localInstanceApi || !localToken) {
      toast({
        title: "Missing information",
        description: "Please provide both Instance API URL and Security Token",
        variant: "destructive",
      });
      return;
    }

    try {
      const webhook = onGenerateWebhook(localInstanceApi, localToken);
      setGeneratedWebhook(webhook);
      onSave();
      toast({
        title: "Webhook generated",
        description: "Your webhook URL has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate webhook. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedWebhook);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The webhook URL has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          <CardTitle className="text-lg">Z-API Configuration</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="instanceApi">Instance API URL</Label>
          <Input
            id="instanceApi"
            placeholder="https://api.z-api.io/instances/YOUR_INSTANCE_ID"
            value={localInstanceApi}
            onChange={(e) => setLocalInstanceApi(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            The full URL to your Z-API instance
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token">Security Token</Label>
          <Input
            id="token"
            placeholder="YOUR_SECURITY_TOKEN"
            value={localToken}
            onChange={(e) => setLocalToken(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Your Z-API security token
          </p>
        </div>
        
        {generatedWebhook && (
          <div className="pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <Label>Your Webhook URL</Label>
              <Badge variant="outline" className="bg-green-50 text-green-700">Ready</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={generatedWebhook}
                readOnly
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy this URL and paste it in your Z-API dashboard webhook configuration
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerateWebhook}
          disabled={!localInstanceApi || !localToken}
          className="w-full"
        >
          <Webhook className="mr-2 h-4 w-4" />
          {generatedWebhook ? "Regenerate Webhook" : "Generate Webhook"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ZapiWebhookForm;
