import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, MessageSquare, Copy } from "lucide-react";
import { getCompanyWhatsAppIntegration } from "@/services/whatsapp/getCompanyWhatsAppIntegration";
import { generateQrCode } from "@/services/whatsapp/generateQrCode";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth/hooks";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  InstanceStatusEvent as WsInstanceStatusEvent,
  QrCodeGeneratedEvent,
} from "@/types/websocket";
import { WHATSAPP_INTEGRATION_NAMES } from "@/types/whatsapp-integration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PipelineWhatsAppConnectionProps {
  companyWhatsappIntegrationId: string;
  workspaceId: string;
}

export const PipelineWhatsAppConnection = ({
  companyWhatsappIntegrationId,
  workspaceId,
}: PipelineWhatsAppConnectionProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "close" | "open" | "connecting"
  >("connecting");

  const { data: integration, isLoading } = useQuery({
    queryKey: ["getCompanyWhatsAppIntegration", companyWhatsappIntegrationId],
    queryFn: () => getCompanyWhatsAppIntegration(companyWhatsappIntegrationId),
    enabled: !!companyWhatsappIntegrationId,
  });

  useEffect(() => {
    if (!integration) return;
    if (integration.whatsappIntegrationName === WHATSAPP_INTEGRATION_NAMES.META_CLOUD) {
      setConnectionStatus(
        integration.connectionStatus === "CONNECTED" ? "open" : "close",
      );
    } else {
      setConnectionStatus(integration.status);
    }
  }, [integration]);

  const qrCodeMutation = useMutation({
    mutationFn: () => generateQrCode(companyWhatsappIntegrationId, workspaceId),
    onSuccess: (data) => {
      setQrCodeData(data.qrCode);
      setQrCodeOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao gerar o QR code. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error generating QR code:", error);
    },
  });

  useEffect(() => {
    if (connectionStatus === "open" && qrCodeOpen) {
      setQrCodeOpen(false);
    }
  }, [connectionStatus, qrCodeOpen]);

  const token = localStorage.getItem("token") || "";
  const { socket, connected, joinedWorkspace } = useWebSocket({
    workspaceId,
    token,
    enabled:
      !!integration &&
      integration.whatsappIntegrationName === WHATSAPP_INTEGRATION_NAMES.EVOLUX,
  });

  useEffect(() => {
    if (
      !socket ||
      !joinedWorkspace ||
      !integration ||
      integration.whatsappIntegrationName !== WHATSAPP_INTEGRATION_NAMES.EVOLUX
    ) {
      return;
    }

    const handleInstanceStatus = (event: WsInstanceStatusEvent) => {
      if (event.companyWhatsappIntegrationId === companyWhatsappIntegrationId) {
        console.log("Instance status updated:", event.status);
        setConnectionStatus(event.status as "close" | "open" | "connecting");
      }
    };

    const handleQrGenerated = (event: QrCodeGeneratedEvent) => {
      if (event.companyWhatsappIntegrationId === companyWhatsappIntegrationId) {
        console.log("QR Code generated:", event.qrCode);
        setQrCodeData(event.qrCode);
        setQrCodeOpen(true);
      }
    };

    socket.on("instance:status", handleInstanceStatus);
    socket.on("qr:generated", handleQrGenerated);

    return () => {
      socket.off("instance:status", handleInstanceStatus);
      socket.off("qr:generated", handleQrGenerated);
    };
  }, [socket, joinedWorkspace, integration, companyWhatsappIntegrationId]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "open":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "close":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "open":
        return "Conectado";
      case "connecting":
        return "Conectando";
      case "close":
        return "Desconectado";
      default:
        return "Desconhecido";
    }
  };

  const handleGenerateQrCode = () => {
    qrCodeMutation.mutate();
  };

  const getWebhookUrl = () => {
    if (!integration) return "";

    const frontendUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const companyId = user?.companyId;
    const integrationName = integration.whatsappIntegrationName;
    const integrationId = integration.id;

    const formattedIntegrationName = integrationName
      .toLowerCase()
      .replace(/\s+/g, "-");

    return `${frontendUrl}/webhook/${formattedIntegrationName}/${companyId}/${workspaceId}/${integrationId}`;
  };

  const copyWebhookToClipboard = () => {
    const webhook = getWebhookUrl();

    navigator.clipboard.writeText(webhook);
    setCopied(true);
    toast({
      title: "Copiado para a área de transferência",
      description:
        "A URL do webhook foi copiada para a sua área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return null;
  }

  if (!integration) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-background">
        <MessageSquare className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium">WhatsApp</span>
        {(integration.whatsappIntegrationName ===
          WHATSAPP_INTEGRATION_NAMES.EVOLUX ||
          integration.whatsappIntegrationName ===
            WHATSAPP_INTEGRATION_NAMES.META_CLOUD) && (
          <Badge variant="outline" className="flex items-center gap-1 h-5">
            <span className={`h-2 w-2 rounded-full ${getStatusColor()}`}></span>
            <span className="text-xs">{getStatusText()}</span>
          </Badge>
        )}
        {integration.whatsappIntegrationName ===
          WHATSAPP_INTEGRATION_NAMES.EVOLUX &&
          connectionStatus !== "open" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateQrCode}
              disabled={qrCodeMutation.isPending}
              className="h-7 px-2"
            >
              <QrCode className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">
                {qrCodeMutation.isPending ? "Gerando..." : "Conectar"}
              </span>
            </Button>
          )}
        {integration.whatsappIntegrationName !==
          WHATSAPP_INTEGRATION_NAMES.EVOLUX &&
          integration.whatsappIntegrationName !==
            WHATSAPP_INTEGRATION_NAMES.META_CLOUD && (
          <Button
            variant="ghost"
            size="sm"
            onClick={copyWebhookToClipboard}
            className="h-7 px-2"
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs">Copiar Webhook</span>
          </Button>
          )}
        {integration.whatsappIntegrationName ===
          WHATSAPP_INTEGRATION_NAMES.META_CLOUD &&
          integration.metaDisplayPhoneNumber && (
            <span className="text-xs text-muted-foreground">
              {integration.metaDisplayPhoneNumber}
            </span>
          )}
      </div>

      <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no seu celular e escaneie este QR Code para
              conectar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {qrCodeData ? (
              <img src={qrCodeData} alt="Código QR" className="w-96 h-96" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-gray-500">Carregando QR Code...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
