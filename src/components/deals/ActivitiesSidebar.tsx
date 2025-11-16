import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { listActivities } from "@/services/activity/listActivities";
import { markActivitiesAsRead } from "@/services/activity/markActivitiesAsRead";
import { ActivityItem } from "./ActivityItem";
import { ActivityListSkeleton } from "./ActivityItemSkeleton";
import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Pagination } from "@/types/activity";

interface ActivitiesSidebarProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivitiesSidebar({
  workspaceId,
  isOpen,
  onClose,
}: ActivitiesSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Pagination<Activity>, Error>({
    queryKey: ["activities", workspaceId],
    queryFn: ({ pageParam = 1 }) =>
      listActivities({
        workspaceId,
        page: pageParam as number,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: isOpen && !!workspaceId,
  });

  // Mark activities as read when sidebar opens
  useEffect(() => {
    if (isOpen && workspaceId) {
      // Mark as read when opening
      markActivitiesAsRead({ workspaceId }).then(() => {
        queryClient.invalidateQueries({
          queryKey: ["unreadActivitiesCount", workspaceId],
        });
      });
    }
  }, [isOpen, workspaceId, queryClient]);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1, // Trigger quando 10% do elemento estiver visível
      rootMargin: "100px", // Começa a carregar 100px antes do elemento ficar visível
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  if (!isOpen) return null;

  const allActivities = data?.pages.flatMap((page) => page.items) || [];
  const total = data?.pages[0]?.total || 0;

  return (
    <>
      {/* Sidebar */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-background shadow-lg sm:w-96">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Atividades</h2>
              {total > 0 && (
                <span className="text-sm text-muted-foreground">({total})</span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="space-y-4 p-4">
              {isLoading && <ActivityListSkeleton count={5} />}

              {isError && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-sm text-destructive">
                  Erro ao carregar atividades. Tente novamente.
                </div>
              )}

              {!isLoading && !isError && allActivities.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma atividade encontrada.
                </div>
              )}

              {allActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}

              {/* Infinite scroll trigger and loading state */}
              {hasNextPage && (
                <div ref={observerTarget}>
                  {isFetchingNextPage && <ActivityListSkeleton count={3} />}
                </div>
              )}

              {!hasNextPage && allActivities.length > 0 && (
                <p className="pb-6 text-center text-sm text-muted-foreground">
                  Você alcançou o fim da lista de atividades.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
