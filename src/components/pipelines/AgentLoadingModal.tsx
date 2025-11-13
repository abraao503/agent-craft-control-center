import { useEffect, useState } from "react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Bot, Sparkles, Cpu, Zap, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentLoadingModalProps {
  open: boolean;
  isCreating?: boolean;
  hasAgent?: boolean;
}

const loadingMessagesWithAgent = [
  "Configurando inteligência artificial...",
  "Processando parâmetros do agente...",
  "Estruturando etapas do funil...",
  "Estabelecendo conexões...",
  "Otimizando respostas...",
  "Finalizando configurações...",
];

const loadingMessagesWithoutAgent = [
  "Configurando funil de vendas...",
  "Estruturando etapas...",
  "Processando configurações...",
  "Otimizando fluxo de trabalho...",
  "Finalizando configurações...",
];

export const AgentLoadingModal: React.FC<AgentLoadingModalProps> = ({
  open,
  isCreating = false,
  hasAgent = true,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = hasAgent
    ? loadingMessagesWithAgent
    : loadingMessagesWithoutAgent;

  const mainIcon = hasAgent ? Bot : Workflow;

  useEffect(() => {
    if (!open) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [open, loadingMessages.length]);

  return (
    <Dialog open={open}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          )}
        >
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* Animated Icons */}
            <div className="relative w-32 h-32">
              {/* Center Icon - Bot or Workflow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {hasAgent ? (
                    <Bot className="h-16 w-16 text-primary animate-pulse" />
                  ) : (
                    <Workflow className="h-16 w-16 text-primary animate-pulse" />
                  )}
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                </div>
              </div>

              {/* Orbiting Icons */}
              <div className="absolute inset-0 animate-spin-slow">
                <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-6 text-yellow-500" />
              </div>
              <div
                className="absolute inset-0 animate-spin-slow"
                style={{ animationDelay: "0.5s" }}
              >
                <Cpu className="absolute bottom-0 left-1/2 -translate-x-1/2 h-6 w-6 text-blue-500" />
              </div>
              <div
                className="absolute inset-0 animate-spin-slow"
                style={{ animationDelay: "1s" }}
              >
                <Zap className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 text-purple-500" />
              </div>
              <div
                className="absolute inset-0 animate-spin-slow"
                style={{ animationDelay: "1.5s" }}
              >
                <Sparkles className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 text-pink-500" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {hasAgent
                  ? isCreating
                    ? "Criando Funil com Agente de IA"
                    : "Atualizando Funil e Agente de IA"
                  : isCreating
                  ? "Criando Funil de Vendas"
                  : "Atualizando Funil de Vendas"}
              </h3>
              <p className="text-sm text-muted-foreground animate-pulse">
                {loadingMessages[messageIndex]}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] animate-gradient-x" />
              </div>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              {hasAgent
                ? "Aguarde enquanto configuramos seu funil com agente de IA e as melhores práticas"
                : "Aguarde enquanto configuramos seu funil de vendas"}
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
