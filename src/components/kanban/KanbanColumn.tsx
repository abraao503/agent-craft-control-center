import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DealListItem } from "@/types/deal";
import { PipelineStageMinimal } from "@/types/pipeline";
import { cn, isColorDark } from "@/lib/utils";
import { MessageCircle, Tag as TagIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { listTags } from "@/services/tag/listTags";
import { getDealsByStage } from "@/services/deal/getDealsByStage";

interface KanbanColumnProps {
  stage: PipelineStageMinimal;
  onMoveDeal: (dealId: string, toStageId: string) => Promise<void> | void;
  isMoving?: boolean;
  stageMeta?: { color?: string; winProbability?: number };
  workspaceId?: string;
  onDealClick: (deal: DealListItem) => void;
  dragOverStage: string | null;
  onDragEnter: () => void;
  onDragLeave: (e: React.DragEvent) => void;
}

const formatCurrency = (value: number | null | undefined, currency = "BRL") => {
  const safe = typeof value === "number" ? value : 0;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(safe);
  }
};

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const DealTagsPopover: React.FC<{
  tagIds?: string[];
  workspaceId?: string;
}> = ({ tagIds = [], workspaceId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: allTags = [] } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId!),
    enabled: !!workspaceId && tagIds.length > 0,
  });

  const dealTags = allTags.filter((tag) => tagIds.includes(tag.id));
  const hasTags = tagIds.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className="flex items-center gap-1 cursor-pointer"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground/80">
            {tagIds.length}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3"
        align="end"
        side="right"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="space-y-2">
          {hasTags ? (
            <>
              <p className="text-xs font-medium text-muted-foreground/80">
                Tags do negócio
              </p>
              <div className="flex flex-col gap-1.5">
                {dealTags.length > 0 ? (
                  dealTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{
                        backgroundColor: tag.color,
                        color: isColorDark(tag.color) ? "white" : "black",
                      }}
                      className="text-xs justify-start"
                    >
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground/70">
                    Carregando tags...
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Este negócio não possui tags
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  onMoveDeal,
  isMoving,
  stageMeta,
  workspaceId,
  onDealClick,
  dragOverStage,
  onDragEnter,
  onDragLeave,
}) => {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Infinite query for this stage
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["dealsByStage", stage.id, workspaceId],
      queryFn: ({ pageParam = 0 }) =>
        getDealsByStage({
          stageId: stage.id,
          workspaceId: workspaceId!,
          limit: 10,
          offset: pageParam,
        }),
      getNextPageParam: (lastPage) => {
        const nextOffset = lastPage.offset + lastPage.limit;
        return nextOffset < lastPage.total ? nextOffset : undefined;
      },
      initialPageParam: 0,
      enabled: !!workspaceId,
    });

  const stageDeals = data?.pages.flatMap((page) => page.deals) || [];
  const totalDeals = data?.pages[0]?.total || 0;

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isFetchingNextPage || !hasNextPage) return;

    const viewport = e.currentTarget;
    const scrollTop = viewport.scrollTop;
    const scrollHeight = viewport.scrollHeight;
    const clientHeight = viewport.clientHeight;

    // Calculate scroll percentage
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Trigger when user scrolls past 70% of content
    if (scrollPercentage >= 0.7) {
      fetchNextPage();
    }
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("text/plain", dealId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;
    await onMoveDeal(dealId, stage.id);
  };

  const handleOpenChat = (
    e: React.MouseEvent | React.TouchEvent,
    chatId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (chatId) {
      navigate(`/chats?chatId=${chatId}`);
    }
  };

  const totalValue = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);
  const probability = stageMeta?.winProbability ?? stage.winProbability;
  const totalWeighted =
    probability != null
      ? stageDeals.reduce(
          (acc, d) => acc + (d.value || 0) * (probability / 100),
          0
        )
      : undefined;
  const headerColor = stageMeta?.color || stage.color || undefined;

  return (
    <div
      className="min-w-[320px] w-[320px] max-w-[360px]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      aria-dropeffect="move"
    >
      <Card
        className="flex flex-col flex-1 bg-background/60 border-border overflow-hidden"
        style={
          headerColor ? { borderTop: `3px solid ${headerColor}` } : undefined
        }
      >
        <CardHeader className={cn("py-3 bg-muted/40 border-b border-border")}>
          <CardTitle className="flex flex-col justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate text-foreground/90">
                {stage.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
              <span>{formatCurrency(totalValue)}</span>
              <span>• {totalDeals} negócios</span>
              {totalWeighted != null && (
                <span className="hidden md:inline">
                  • {formatCurrency(totalWeighted)}
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div
            className={cn(
              "rounded-md transition ring-offset-1",
              dragOverStage === stage.id && "ring-2 ring-primary/40"
            )}
          >
            <ScrollArea
              className="h-[calc(100vh-340px)] pr-1"
              ref={viewportRef}
              onScroll={handleScroll}
            >
              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className={cn(
                      "rounded-md border p-3 bg-card shadow-sm hover:shadow transition group relative",
                      isMoving && "opacity-70"
                    )}
                    draggable
                    onDragStart={(e) => {
                      // Only start drag if not clicking on button area
                      const target = e.target as HTMLElement;
                      if (target.closest("[data-no-drag]")) {
                        e.preventDefault();
                        return;
                      }
                      handleDragStart(e, deal.id);
                    }}
                    onClick={(e) => {
                      // Only open modal if not clicking on button area
                      const target = e.target as HTMLElement;
                      if (target.closest("[data-no-drag]")) {
                        return;
                      }
                      onDealClick(deal);
                    }}
                    aria-grabbed="true"
                  >
                    {/* User Avatar in top-right corner */}
                    {deal.assignedUser && (
                      <div
                        className="absolute top-2 right-2"
                        title={deal.assignedUser.name}
                      >
                        <Avatar className="h-8 w-8 border border-border/50">
                          <AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">
                            {getInitials(deal.assignedUser.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    <div className="font-medium text-sm truncate text-foreground/90 pr-8">
                      {deal.title}
                    </div>
                    {deal.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {deal.description}
                      </div>
                    )}
                    {deal.dueDate && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs">Data de vencimento</div>
                        <div
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-xs font-medium",
                            new Date(deal.dueDate) < new Date()
                              ? "bg-red-500/90 text-white"
                              : "bg-muted text-foreground/80"
                          )}
                        >
                          {new Date(deal.dueDate).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="font-semibold text-foreground/85">
                        {formatCurrency(
                          deal.value ?? 0,
                          deal.currency ?? "BRL"
                        )}
                      </span>
                      <span className="text-xs text-foreground/90 font-medium">
                        {deal.customer?.name || "Cliente"}
                      </span>
                    </div>

                    {/* Buttons area - not draggable */}
                    <div
                      className="flex items-center gap-1 mt-2 justify-end"
                      data-no-drag="true"
                    >
                      <DealTagsPopover
                        tagIds={deal.tags}
                        workspaceId={workspaceId}
                      />
                      <div
                        className={cn(
                          "inline-flex items-center justify-center h-7 w-7 p-0 rounded-md transition-colors",
                          deal.customer?.chatId
                            ? "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            : "opacity-50 cursor-not-allowed"
                        )}
                        onClick={(e) => {
                          if (!deal.customer?.chatId) return;
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenChat(e, deal.customer?.chatId);
                        }}
                        title={
                          deal.customer?.chatId
                            ? "Open chat"
                            : "No chat available"
                        }
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && !isLoading && (
                  <div className="text-sm text-muted-foreground/70 py-8 text-center border rounded-md bg-muted/20">
                    Arraste negócios para esta etapa
                  </div>
                )}

                {isLoading && stageDeals.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {isFetchingNextPage && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
