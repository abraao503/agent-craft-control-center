import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { getUnreadActivitiesCount } from "@/services/activity/getUnreadActivitiesCount";
import { useEffect } from "react";
import { Socket } from "socket.io-client";

interface ActivitiesButtonProps {
  workspaceId: string;
  onClick: () => void;
  isOpen: boolean;
  socket: Socket | null;
}

export function ActivitiesButton({
  workspaceId,
  onClick,
  isOpen,
  socket,
}: ActivitiesButtonProps) {
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ["unreadActivitiesCount", workspaceId],
    queryFn: () => getUnreadActivitiesCount({ workspaceId }),
    enabled: !!workspaceId,
    refetchInterval: isOpen ? false : 30000, // Refetch every 30s when closed
    staleTime: 25000, // Consider data fresh for 25s
  });

  // Listen to websocket events and increment counter
  useEffect(() => {
    if (!socket || !workspaceId) return;

    const handleActivityCreated = () => {
      // Increment counter optimistically
      queryClient.setQueryData<{ count: number }>(
        ["unreadActivitiesCount", workspaceId],
        (old) => {
          if (!old) return { count: 1 };
          return { count: old.count + 1 };
        }
      );
    };

    socket.on("activity:created", handleActivityCreated);

    return () => {
      socket.off("activity:created", handleActivityCreated);
    };
  }, [socket, workspaceId, queryClient]);

  const unreadCount = unreadData?.count || 0;
  const hasUnread = unreadCount > 0;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      title="Atividades"
      className="relative"
    >
      <Clock className="h-5 w-5" />
      {hasUnread && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
