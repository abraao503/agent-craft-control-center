import { AlertTriangle, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth/hooks";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function formatRemaining(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

export function ImpersonationBanner() {
  const { user, userProfile, stopImpersonation } = useAuth();
  const { toast } = useToast();
  const [remaining, setRemaining] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  const impersonation = userProfile?.impersonation;

  useEffect(() => {
    if (!impersonation) return;

    const updateRemaining = () => {
      setRemaining(new Date(impersonation.expiresAt).getTime() - Date.now());
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 60_000);
    return () => window.clearInterval(timer);
  }, [impersonation]);

  if (!impersonation || !user) return null;

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await stopImpersonation();
    } catch {
      toast({
        title: "Não foi possível voltar para sua conta",
        description: "A sessão pode ter expirado. Faça login novamente.",
        variant: "destructive",
      });
      setIsStopping(false);
    }
  };

  return (
    <div className="relative z-40 flex min-h-12 items-center justify-between gap-4 bg-amber-500 px-4 py-2 text-amber-950 shadow-sm md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="truncate">
          <strong>Você está acessando como {user.name}</strong>{" "}
          <span className="hidden sm:inline">
            ({user.email}). Todas as ações serão reais. Admin original: {impersonation.actorName}.
          </span>
        </p>
        <span
          key={remaining > 0 ? "active" : "initial"}
          className="shrink-0 whitespace-nowrap font-medium"
        >
          Expira em {formatRemaining(remaining)}.
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 border-amber-900/30 bg-amber-50 text-amber-950 hover:bg-amber-100"
        onClick={handleStop}
        disabled={isStopping}
      >
        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
        {isStopping ? (
          "Voltando..."
        ) : (
          <>
            <span className="hidden sm:inline">Voltar para minha conta</span>
            <span className="sm:hidden">Voltar</span>
          </>
        )}
      </Button>
    </div>
  );
}
