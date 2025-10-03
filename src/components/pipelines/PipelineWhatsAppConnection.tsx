import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, MessageSquare } from "lucide-react";
import { getCompanyWhatsAppIntegration } from "@/services/whatsapp/getCompanyWhatsAppIntegration";
import { generateQrCode } from "@/services/whatsapp/generateQrCode";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth/hooks";
import { connectSocket } from "@/lib/socket";
import { InstanceStatusEvent } from "@/types/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PipelineWhatsAppConnectionProps {
  companyWhatsappIntegrationId: string;
}

export const PipelineWhatsAppConnection = ({
  companyWhatsappIntegrationId,
}: PipelineWhatsAppConnectionProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>("");
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
    setConnectionStatus(integration.status);
  }, [integration]);

  const qrCodeMutation = useMutation({
    mutationFn: () => generateQrCode(companyWhatsappIntegrationId),
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

  useEffect(() => {
    if (!integration || integration.whatsappIntegrationName !== "evolux")
      return;

    const token = localStorage.getItem("token");
    const socket = connectSocket(token);

    socket.on("connect", () => {
      const room = `company:${user.companyId}`;
      socket.emit("join", { room });
    });

    socket.on("instance:status", (event: InstanceStatusEvent) => {
      if (event.companyWhatsappIntegrationId === companyWhatsappIntegrationId) {
        setConnectionStatus(event.status);
      }
    });

    socket.on("qr:generated", (event) => {
      if (event.companyWhatsappIntegrationId === companyWhatsappIntegrationId) {
        setQrCodeData(event.qrCode);
        setQrCodeOpen(true);
      }
    });

    socket.emit("get:instance:status", {
      integrationId: companyWhatsappIntegrationId,
    });

    return () => {
      socket.disconnect();
    };
  }, [integration, companyWhatsappIntegrationId, user.companyId]);

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
        {integration.whatsappIntegrationName === "evolux" && (
          <Badge variant="outline" className="flex items-center gap-1 h-5">
            <span
              className={`h-2 w-2 rounded-full ${getStatusColor()}`}
            ></span>
            <span className="text-xs">{getStatusText()}</span>
          </Badge>
        )}
        {integration.whatsappIntegrationName === "evolux" &&
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
