import { CompanyWhatsAppIntegration } from "@/types/whatsapp";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listWhatsAppIntegrations } from "@/services/whatsapp";
import { listAgent } from "@/services/agent/listAgent";

interface WhatsAppIntegrationCardProps {
  integration: CompanyWhatsAppIntegration;
  onDelete: (id: string) => void;
}

const WhatsAppIntegrationCard = ({
  integration,
  onDelete,
}: WhatsAppIntegrationCardProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: whatsappIntegrations } = useQuery({
    queryKey: ["whatsapp-integrations"],
    queryFn: listWhatsAppIntegrations,
  });

  const { data: agentsData } = useQuery({
    queryKey: ["agents"],
    queryFn: listAgent,
  });

  const copyPostbackUrlToClipboard = () => {
    const webhook = getWebhookUrl();

    navigator.clipboard.writeText(webhook);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The postback URL has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

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

  const getWebhookUrl = () => {
    const frontendUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const companyId = getUserCompanyId();
    const integrationName = integration.whatsappIntegrationName || "unknown";

    const formattedIntegrationName = integrationName
      .toLowerCase()
      .replace(/\s+/g, "-");

    return `${frontendUrl}/webhook/${formattedIntegrationName}/${companyId}/${integration.agent.id}`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">
            {integration.whatsappIntegrationName}
          </CardTitle>
        </div>
        <CardDescription>
          Connected to: {integration.agent.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Integration ID:</span>{" "}
            {integration.id.substring(0, 8)}...
          </p>
          <div className="pt-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="font-medium text-foreground">Webhook URL:</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="truncate text-xs font-mono bg-gray-50 p-1 rounded border flex-grow">
                {getWebhookUrl()}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 h-6 w-6 p-0"
                onClick={copyPostbackUrlToClipboard}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end">
        <div className="flex space-x-2">
          <Link to={`/integrations/edit/${integration.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </Link>
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
