import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DealListItem } from "@/types/deal";
import { PipelineStageMinimal } from "@/types/pipeline";
import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";
import { DealDetailsModal } from "@/components/deals/DealDetailsModal";

interface KanbanBoardProps {
  stages: PipelineStageMinimal[];
  deals: DealListItem[];
  onMoveDeal: (dealId: string, toStageId: string) => Promise<void> | void;
  isMoving?: boolean;
  stageMeta?: Record<string, { color?: string; winProbability?: number }>; // optional extra
  workspaceId?: string;
  onDealUpdated?: () => void;
}

// Format currency safely
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

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  deals,
  onMoveDeal,
  isMoving,
  stageMeta,
  workspaceId,
  onDealUpdated,
}) => {
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<DealListItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const dealsByStage = useMemo(() => {
    const map: Record<string, DealListItem[]> = {};
    stages.forEach((s) => (map[s.id] = []));
    deals.forEach((d) => {
      if (!map[d.stageId]) map[d.stageId] = [];
      map[d.stageId].push(d);
    });
    return map;
  }, [stages, deals]);

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("text/plain", dealId);
    // to allow drop effects
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;
    setDragOverStage(null);
    await onMoveDeal(dealId, toStageId);
  };

  const handleDealClick = (deal: DealListItem) => {
    setSelectedDeal(deal);
    setDetailsModalOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex items-start gap-4 h-[calc(100vh-220px)] w-max pr-2">
          {stages.map((stage) => {
          const stageDeals = dealsByStage[stage.id] || [];
          const totalValue = stageDeals.reduce(
            (acc, d) => acc + (d.value || 0),
            0
          );
          const probability =
            stageMeta?.[stage.id]?.winProbability ?? stage.winProbability;
          const totalWeighted =
            probability != null
              ? stageDeals.reduce(
                  (acc, d) => acc + (d.value || 0) * (probability / 100),
                  0
                )
              : undefined;
          const headerColor =
            stageMeta?.[stage.id]?.color || stage.color || undefined;

          return (
            <div
              key={stage.id}
              className="min-w-[320px] w-[320px] max-w-[360px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              onDragEnter={() => setDragOverStage(stage.id)}
              onDragLeave={(e) => {
                if (
                  (e.currentTarget as HTMLElement).contains(
                    e.relatedTarget as Node
                  )
                )
                  return;
                setDragOverStage((curr) => (curr === stage.id ? null : curr));
              }}
              aria-dropeffect="move"
            >
              <Card className="flex flex-col flex-1 bg-background/60 border-border">
                <CardHeader
                  className={cn(
                    "py-3 bg-muted/40 rounded-t-xl border-b border-border"
                  )}
                  style={
                    headerColor
                      ? { borderTop: `4px solid ${headerColor}` }
                      : undefined
                  }
                >
                  <CardTitle className="flex flex-col justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">
                        {stage.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{formatCurrency(totalValue)}</span>
                      <span>• {stageDeals.length} negócios</span>
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
                    <ScrollArea className="h-[calc(100vh-340px)] pr-1">
                      <div className="space-y-2">
                        {stageDeals.map((deal) => (
                          <div
                            key={deal.id}
                            className={cn(
                              "rounded-md border p-3 bg-card cursor-move shadow-sm hover:shadow transition",
                              isMoving && "opacity-70"
                            )}
                            draggable
                            onDragStart={(e) => handleDragStart(e, deal.id)}
                            onClick={() => handleDealClick(deal)}
                            aria-grabbed="true"
                          >
                            <div className="font-medium text-sm truncate">
                              {deal.title}
                            </div>
                            {deal.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {deal.description}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2 text-xs">
                              <span className="font-semibold">
                                {formatCurrency(
                                  deal.value ?? 0,
                                  deal.currency ?? "BRL"
                                )}
                              </span>
                              <span className="text-muted-foreground truncate">
                                {deal.customer?.name || "Cliente"}
                              </span>
                            </div>
                          </div>
                        ))}
                        {stageDeals.length === 0 && (
                          <div className="text-sm text-muted-foreground py-8 text-center border rounded-md bg-muted/20">
                            Arraste negócios para esta etapa
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
        </div>
      </div>

      {workspaceId && (
        <DealDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          deal={selectedDeal}
          workspaceId={workspaceId}
          onUpdated={onDealUpdated}
        />
      )}
    </>
  );
};

export default KanbanBoard;
