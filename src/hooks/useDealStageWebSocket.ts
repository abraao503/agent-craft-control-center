import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Socket } from "socket.io-client";
import { DealStageChangedEvent } from "@/types/websocket-events";
import { DealListItem, GetDealsByStageResponse } from "@/types/deal";

interface UseDealStageWebSocketProps {
  socket: Socket | null;
  workspaceId: string;
  pipelineId: string;
  enabled?: boolean;
}

export function useDealStageWebSocket({
  socket,
  workspaceId,
  pipelineId,
  enabled = true,
}: UseDealStageWebSocketProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !workspaceId || !pipelineId || !enabled) return;

    const handleDealStageChanged = (event: DealStageChangedEvent) => {
      // Only process if it's from the current pipeline
      if (event.pipelineId !== pipelineId) return;

      const { dealId, fromStageId, toStageId } = event;

      // Get all queries for both stages
      const fromQueries = queryClient.getQueriesData<{
        pages: GetDealsByStageResponse[];
      }>({
        queryKey: ["dealsByStage", fromStageId, workspaceId],
      });

      const toQueries = queryClient.getQueriesData<{
        pages: GetDealsByStageResponse[];
      }>({
        queryKey: ["dealsByStage", toStageId, workspaceId],
      });

      let movedDeal: DealListItem | null = null;

      // Remove from old stage
      if (fromStageId) {
        fromQueries.forEach(([queryKey, currentData]) => {
          if (!currentData) return;

          queryClient.setQueryData<{ pages: GetDealsByStageResponse[] }>(
            queryKey,
            (old) => {
              if (!old) return old;

              return {
                ...old,
                pages: old.pages.map((page) => {
                  // Find and store the deal before removing
                  if (!movedDeal) {
                    const deal = page.items.find((d) => d.id === dealId);
                    if (deal) {
                      movedDeal = { ...deal, stageId: toStageId };
                    }
                  }

                  return {
                    ...page,
                    items: page.items.filter((d) => d.id !== dealId),
                    total: Math.max(0, page.total - 1),
                  };
                }),
              };
            }
          );
        });
      }

      // Add to new stage
      if (movedDeal) {
        toQueries.forEach(([queryKey]) => {
          queryClient.setQueryData<{ pages: GetDealsByStageResponse[] }>(
            queryKey,
            (old) => {
              if (!old) return old;

              return {
                ...old,
                pages: old.pages.map((page, index) => {
                  // Add to first page
                  if (index === 0) {
                    // Check if deal already exists to avoid duplicates
                    const exists = page.items.some((d) => d.id === dealId);
                    if (exists) return page;

                    return {
                      ...page,
                      items: [movedDeal!, ...page.items],
                      total: page.total + 1,
                    };
                  }
                  return page;
                }),
              };
            }
          );
        });
      }
    };

    socket.on("deal:stage-changed", handleDealStageChanged);

    return () => {
      socket.off("deal:stage-changed", handleDealStageChanged);
    };
  }, [socket, workspaceId, pipelineId, enabled, queryClient]);
}
