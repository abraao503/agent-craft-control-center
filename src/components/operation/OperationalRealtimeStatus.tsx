import { Loader2, ShieldAlert, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OperationalRealtimeStatus as RealtimeStatus } from "@/types/operational-realtime";

interface OperationalRealtimeStatusProps {
  status: RealtimeStatus;
  joinedWorkspace: boolean;
}

export function OperationalRealtimeStatus({
  status,
  joinedWorkspace,
}: OperationalRealtimeStatusProps) {
  if (status === "disabled") return null;

  if (status === "connected" && joinedWorkspace) {
    return null;
  }

  if (status === "access-denied") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <ShieldAlert className="h-3.5 w-3.5" />
        Acesso ao tempo real indisponível
      </Badge>
    );
  }

  if (status === "offline") {
    return (
      <Badge variant="outline" className="gap-1.5">
        <WifiOff className="h-3.5 w-3.5" />
        Atualização manual necessária
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Reconectando atualizações...
    </Badge>
  );
}
