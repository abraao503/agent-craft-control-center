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
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";

interface WhatsAppFormProps {
  onSubmit: (data: WhatsAppFormData) => void;
  initialData?: Partial<WhatsAppFormData>;
  isEditMode?: boolean;
  isLoading: boolean;
}

const defaultFormData: WhatsAppFormData = {
  externalToken: "",
  externalClientToken: "",
  postbackUrl: "",
  agentId: "",
  whatsappIntegrationName: "z-api" as "z-api" | "evolux",
};

const WhatsAppForm = ({
  onSubmit,
  initialData = {},
  isEditMode = false,
  isLoading,
}: WhatsAppFormProps) => {
  const [formData, setFormData] = useState<WhatsAppFormData>({
    ...defaultFormData,
    ...initialData,
    whatsappIntegrationName: initialData.whatsappIntegrationName || "z-api",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWebhookPreview, setShowWebhookPreview] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const { workspaceId } = useWorkspaceManager();

  const { data: whatsappIntegrations = [], isLoading: isLoadingIntegrations } =
    useQuery({
      queryKey: ["list-whatsapp-integrations"],
      queryFn: listWhatsAppIntegrations,
    });

  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => listAgent(workspaceId),
  });

  // Get selected WhatsApp integration name
  const selectedIntegration = whatsappIntegrations.find(
    (integration) => integration.name === formData.whatsappIntegrationName
  );

  // Get company ID from localStorage
  const getUserCompanyId = () => {
    const userJson = localStorage.getItem("user");
    if (!userJson) return "";
    try {
      const user = JSON.parse(userJson);
      return user.companyId || "";
    } catch (e) {
      console.error("Failed to parse user data from localStorage", e);
      return "";
    }
  };

  // Generate webhook URL when needed values change
  useEffect(() => {
    if (formData.whatsappIntegrationName && formData.agentId) {
      const frontendUrl =
        import.meta.env.VITE_API_URL || window.location.origin;
      const companyId = getUserCompanyId();
      const integrationName = formData.whatsappIntegrationName;

      // Convert integration name to kebab-case for the URL
      const formattedIntegrationName = integrationName
        .toLowerCase()
        .replace(/\s+/g, "-");

      setWebhookUrl(
        `${frontendUrl}/webhook/${formattedIntegrationName}/${companyId}/${formData.agentId}`
      );
    }
  }, [formData.whatsappIntegrationName, formData.agentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.whatsappIntegrationName !== "evolux" && !showWebhookPreview) {
      setShowWebhookPreview(true);
      return;
    }

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

  const copyWebhookToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      description: "Webhook URL copied to clipboard",
    });
  };

  // Reset the webhook preview when the user changes important form data
  useEffect(() => {
    if (showWebhookPreview) {
      setShowWebhookPreview(false);
    }
  }, [formData.whatsappIntegrationName, formData.agentId]);

  const getButtonText = () => {
    if (isSubmitting) {
      return "Saving...";
    }

    if (showWebhookPreview || formData.whatsappIntegrationName === "evolux") {
      return isEditMode ? "Update Integration" : "Create Integration";
    }

    return "Continue";
  };

  const disableButton = () => {
    if (formData.whatsappIntegrationName === "evolux") {
      return isSubmitting || !formData.agentId;
    }

    return (
      isSubmitting ||
      !formData.externalToken ||
      !formData.externalClientToken ||
      !formData.agentId ||
      !formData.whatsappIntegrationName ||
      !formData.postbackUrl
    );
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
            <Label htmlFor="whatsappIntegrationName">Type of Integration</Label>
            <Select
              value={formData.whatsappIntegrationName}
              onValueChange={(value) =>
                updateFormData({
                  whatsappIntegrationName: value as "z-api" | "evolux",
                })
              }
              disabled={isEditMode}
            >
              <SelectTrigger id="whatsappIntegrationName">
                <SelectValue placeholder="Select WhatsApp integration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="z-api">Z-API</SelectItem>
                <SelectItem value="evolux">Evolux</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentId">Agent</Label>
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
                  agentsData?.agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The AI agent to connect to WhatsApp
            </p>
          </div>

          {formData.whatsappIntegrationName === "z-api" && (
            <div className="space-y-2">
              <Label htmlFor="externalToken">External Token</Label>
              <Input
                id="externalToken"
                value={formData.externalToken}
                onChange={(e) =>
                  updateFormData({ externalToken: e.target.value })
                }
                placeholder="Enter your external token"
              />
              <p className="text-sm text-muted-foreground">
                Token provided by your WhatsApp provider
              </p>
            </div>
          )}

          {formData.whatsappIntegrationName === "z-api" && (
            <div className="space-y-2">
              <Label htmlFor="externalClientToken">Client Token</Label>
              <Input
                id="externalClientToken"
                value={formData.externalClientToken}
                onChange={(e) =>
                  updateFormData({ externalClientToken: e.target.value })
                }
                placeholder="Enter your client token"
              />
              <p className="text-sm text-muted-foreground">
                Client token provided by your WhatsApp provider
              </p>
            </div>
          )}

          {formData.whatsappIntegrationName === "z-api" && (
            <div className="space-y-2">
              <Label htmlFor="postbackUrl">Postback URL</Label>
              <Input
                id="postbackUrl"
                value={formData.postbackUrl}
                onChange={(e) =>
                  updateFormData({ postbackUrl: e.target.value })
                }
                placeholder="Enter postback URL"
                disabled={showWebhookPreview}
              />
              <p className="text-sm text-muted-foreground">
                The URL where WhatsApp will send incoming messages
              </p>
            </div>
          )}

          {showWebhookPreview && (
            <div className="mt-8 p-6 border rounded-md bg-muted">
              <h3 className="font-medium text-lg mb-3">
                Webhook URL for External Platform
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Copy this webhook URL and use it in your WhatsApp platform
                settings before creating the integration.
              </p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm pr-10 bg-background"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={copyWebhookToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={handleBackToIntegrations}>
            Back
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={disableButton()}
            isLoading={isLoading}
          >
            {getButtonText()}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppForm;
