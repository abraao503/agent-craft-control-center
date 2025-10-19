import {
  CompanyWhatsAppIntegration,
  InstanceStatusEvent,
} from "@/types/whatsapp";
import { WHATSAPP_INTEGRATION_NAMES } from "@/types/whatsapp-integration";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateQrCode,
  activateCompanyWhatsAppIntegration,
  deactivateCompanyWhatsAppIntegration,
} from "@/services/whatsapp";
import { listAgent } from "@/services/agent/listAgent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth/hooks";
import { useWebSocket } from "@/hooks/useWebSocket";
import { InstanceStatusEvent as WsInstanceStatusEvent, QrCodeGeneratedEvent } from "@/types/websocket";

interface WhatsAppIntegrationCardProps {
  integration: CompanyWhatsAppIntegration;
  workspaceId: string;
  onDelete: (id: string) => void;
}

const WhatsAppIntegrationCard = ({
  integration,
  workspaceId,
  onDelete,
}: WhatsAppIntegrationCardProps) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<
    "close" | "open" | "connecting"
  >(integration.status || "close");
  const [isActive, setIsActive] = useState<boolean>(integration.active);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: agentsData } = useQuery({
    queryKey: ["agents", user?.companyId],
    queryFn: () => listAgent(user?.companyId || ""),
    enabled: !!user?.companyId,
  });

  const activateMutation = useMutation({
    mutationFn: () => activateCompanyWhatsAppIntegration(integration.id),
    onSuccess: () => {
      toast({
        title: "Integração ativada",
        description: "A integração do WhatsApp foi ativada com sucesso.",
      });
      queryClient.invalidateQueries({
        queryKey: ["company-whatsapp-integrations"],
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao ativar a integração do WhatsApp.",
        variant: "destructive",
      });
      console.error("Erro ao ativar integração do WhatsApp:", error);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateCompanyWhatsAppIntegration(integration.id),
    onSuccess: () => {
      toast({
        title: "Integração desativada",
        description: "A integração do WhatsApp foi desativada com sucesso.",
      });
      queryClient.invalidateQueries({
        queryKey: ["company-whatsapp-integrations"],
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao desativar a integração do WhatsApp.",
        variant: "destructive",
      });
      console.error("Erro ao desativar integração do WhatsApp:", error);
    },
  });

  const qrCodeMutation = useMutation({
    mutationFn: () => generateQrCode(integration.id),
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
      console.error("Erro ao gerar QR code:", error);
    },
  });

  // Efeito para fechar o modal de QR code quando o status mudar para "open"
  useEffect(() => {
    if (connectionStatus === "open" && qrCodeOpen) {
      setQrCodeOpen(false);
    }
  }, [connectionStatus, qrCodeOpen]);

  // Atualiza o estado local quando a integração mudar
  useEffect(() => {
    setIsActive(integration.active);
  }, [integration.active]);

  const token = localStorage.getItem("token") || "";
  const { socket, connected, joinedWorkspace } = useWebSocket({
    workspaceId,
    token,
    enabled: integration.whatsappIntegrationName === WHATSAPP_INTEGRATION_NAMES.EVOLUX,
  });

  useEffect(() => {
    if (!socket || !joinedWorkspace || integration.whatsappIntegrationName !== WHATSAPP_INTEGRATION_NAMES.EVOLUX) {
      return;
    }

    const handleInstanceStatus = (event: WsInstanceStatusEvent) => {
      if (event.companyWhatsappIntegrationId === integration.id) {
        console.log('Instance status updated:', event.status);
        setConnectionStatus(event.status as "close" | "open" | "connecting");
      }
    };

    const handleQrGenerated = (event: QrCodeGeneratedEvent) => {
      if (event.companyWhatsappIntegrationId === integration.id) {
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
  }, [socket, joinedWorkspace, integration.id, integration.whatsappIntegrationName]);

  const copyPostbackUrlToClipboard = () => {
    const webhook = getWebhookUrl();

    navigator.clipboard.writeText(webhook);
    setCopied(true);
    toast({
      title: "Copiado para a área de transferência",
      description:
        "A URL de postback foi copiada para a sua área de transferência.",
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
    const integrationName = integration.whatsappIntegrationName;
    const integrationId = integration.id;

    const formattedIntegrationName = integrationName
      .toLowerCase()
      .replace(/\s+/g, "-");

    return `${frontendUrl}/webhook/${formattedIntegrationName}/${companyId}/${workspaceId}/${integrationId}`;
  };

  const handleGenerateQrCode = () => {
    qrCodeMutation.mutate();
  };

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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">
            {integration.whatsappIntegrationName}
          </CardTitle>
          <div className="flex items-center gap-2">
            {integration.whatsappIntegrationName === WHATSAPP_INTEGRATION_NAMES.EVOLUX && (
              <Badge variant="outline" className="flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${getStatusColor()}`}
                ></span>
                {getStatusText()}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => {
                  setIsActive(checked);
                  if (checked) {
                    activateMutation.mutate();
                  } else {
                    deactivateMutation.mutate();
                  }
                }}
                disabled={
                  activateMutation.isPending || deactivateMutation.isPending
                }
              />
              <span className="text-xs text-muted-foreground">
                {isActive ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>
        <CardDescription>Conectado a: {integration.agent.name}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2 text-sm text-muted-foreground">
          {integration.whatsappIntegrationName !== WHATSAPP_INTEGRATION_NAMES.EVOLUX && (
            <div className="pt-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-foreground">
                  URL do Webhook:
                </span>
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
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end">
        <div className="flex flex-wrap gap-x-2">
          {integration.whatsappIntegrationName === WHATSAPP_INTEGRATION_NAMES.EVOLUX &&
            connectionStatus !== "open" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateQrCode}
                disabled={qrCodeMutation.isPending}
              >
                <QrCode className="w-4 h-4 mr-1" />
                {qrCodeMutation.isPending ? "Gerando..." : "Gerar QR Code"}
              </Button>
            )}
          <Link to={`/integrations/edit/${integration.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(integration.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Excluir
          </Button>
        </div>
      </CardFooter>

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
    </Card>
  );
};

export default WhatsAppIntegrationCard;
