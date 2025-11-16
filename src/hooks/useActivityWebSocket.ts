import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Socket } from "socket.io-client";
import { ActivityCreatedEvent } from "@/types/websocket-events";
import { Activity, Pagination } from "@/types/activity";

interface UseActivityWebSocketProps {
  socket: Socket | null;
  workspaceId: string;
  enabled?: boolean;
}

export function useActivityWebSocket({
  socket,
  workspaceId,
  enabled = true,
}: UseActivityWebSocketProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !workspaceId || !enabled) return;

    const handleActivityCreated = (event: ActivityCreatedEvent) => {
      // Invalidate to refetch and get the complete activity data
      queryClient.invalidateQueries({
        queryKey: ["activities", workspaceId],
      });

      // Note: Counter is incremented directly in ActivitiesButton component
    };

    socket.on("activity:created", handleActivityCreated);

    return () => {
      socket.off("activity:created", handleActivityCreated);
    };
  }, [socket, workspaceId, enabled, queryClient]);
}
