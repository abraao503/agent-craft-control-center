import { useEffect, useState } from "react";
import { WhatsAppFormData } from "@/types/whatsapp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { listWhatsAppIntegrations } from "@/services/whatsapp";
import { listAgent } from "@/services/agent/listAgent";
import { useNavigate } from "react-router-dom";

interface WhatsAppFormProps {
  onSubmit: (data: WhatsAppFormData) => void;
  initialData?: Partial<WhatsAppFormData>;
  isEditMode?: boolean;
}

const defaultFormData: WhatsAppFormData = {
  externalToken: "",
  externalClientToken: "",
  postbackUrl: "",
  agentId: "",
  whatsappIntegrationId: "",
};

const WhatsAppForm = ({
  onSubmit,
  initialData = {},
  isEditMode = false,
}: WhatsAppFormProps) => {
  const [formData, setFormData] = useState<WhatsAppFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { data: whatsappIntegrations = [], isLoading: isLoadingIntegrations } =
    useQuery({
      queryKey: ["list-whatsapp-integrations"],
      queryFn: listWhatsAppIntegrations,
    });

  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: listAgent,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      onSubmit(formData);
    } catch (error) {
      console.error("Error submitting WhatsApp integration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<WhatsAppFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleBackToIntegrations = () => {
    navigate("/integrations");
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditMode
            ? "Edit WhatsApp Integration"
            : "New WhatsApp Integration"}
        </CardTitle>
        <CardDescription>Connect your AI agents to WhatsApp</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="whatsappIntegrationId">WhatsApp Integration</Label>
            <Select
              value={formData.whatsappIntegrationId}
              onValueChange={(value) =>
                updateFormData({ whatsappIntegrationId: value })
              }
              disabled={isEditMode}
            >
              <SelectTrigger id="whatsappIntegrationId">
                <SelectValue placeholder="Select a WhatsApp integration" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingIntegrations ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  whatsappIntegrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {integration.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The WhatsApp integration to use
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
                {isLoadingAgents ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  agentsData?.agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The AI agent that will respond to WhatsApp messages.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalToken">External Token</Label>
            <Input
              id="externalToken"
              placeholder="Enter external token"
              value={formData.externalToken}
              onChange={(e) =>
                updateFormData({ externalToken: e.target.value })
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              The token to authenticate with WhatsApp.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalClientToken">External Client Token</Label>
            <Input
              id="externalClientToken"
              placeholder="Enter external client token"
              value={formData.externalClientToken}
              onChange={(e) =>
                updateFormData({ externalClientToken: e.target.value })
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              The client token to authenticate with WhatsApp.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postbackUrl">Postback URL</Label>
            <Input
              id="postbackUrl"
              placeholder="https://example.com/webhook"
              value={formData.postbackUrl}
              onChange={(e) => updateFormData({ postbackUrl: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              The URL WhatsApp will send messages to (optional).
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          type="button"
          onClick={handleBackToIntegrations}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !formData.externalToken ||
            !formData.externalClientToken ||
            !formData.agentId ||
            !formData.whatsappIntegrationId
          }
        >
          {isSubmitting
            ? "Saving..."
            : isEditMode
            ? "Update Integration"
            : "Create Integration"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppForm;
