
import { useState } from 'react';
import { WhatsAppFormData } from '@/types/whatsapp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AGENTS } from '@/services/mockData';

interface WhatsAppFormProps {
  onSubmit: (data: WhatsAppFormData) => void;
  initialData?: WhatsAppFormData;
}

const defaultFormData: WhatsAppFormData = {
  name: '',
  provider: 'twilio',
  phoneNumber: '',
  agentId: '',
};

const WhatsAppForm = ({ onSubmit, initialData = defaultFormData }: WhatsAppFormProps) => {
  const [formData, setFormData] = useState<WhatsAppFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting WhatsApp integration:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<WhatsAppFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>WhatsApp Integration</CardTitle>
        <CardDescription>
          Connect an AI agent to WhatsApp using third-party services like Twilio or Z-API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Integration Name</Label>
            <Input
              id="name"
              placeholder="e.g., Support WhatsApp"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              required
            />
            <p className="text-sm text-muted-foreground">
              A descriptive name to identify this integration.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={formData.provider}
              onValueChange={(value: 'twilio' | 'zapi' | 'other') => updateFormData({ provider: value })}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="zapi">Z-API</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The third-party service you're using to connect to WhatsApp.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">WhatsApp Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="+1234567890"
              value={formData.phoneNumber}
              onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
              required
            />
            <p className="text-sm text-muted-foreground">
              The phone number associated with this WhatsApp account, including country code.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentId">Select Agent</Label>
            <Select
              value={formData.agentId}
              onValueChange={(value) => updateFormData({ agentId: value })}
            >
              <SelectTrigger id="agentId">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {AGENTS.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The AI agent that will respond to WhatsApp messages.
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" type="button">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.name || !formData.phoneNumber || !formData.agentId}
        >
          {isSubmitting ? "Saving..." : "Save Integration"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppForm;
