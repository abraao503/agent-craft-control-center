import React, { useState } from "react";
import { DealListItem } from "@/types/deal";
import { PipelineStageMinimal } from "@/types/pipeline";
import { DealViewModal } from "@/components/deals/DealViewModal";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  stages: PipelineStageMinimal[];
  onMoveDeal: (dealId: string, toStageId: string) => Promise<void> | void;
  isMoving?: boolean;
  stageMeta?: Record<string, { color?: string; winProbability?: number }>;
  workspaceId?: string;
  pipelineId?: string;
  onDealUpdated?: () => void;
  assignedUserId?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  onMoveDeal,
  isMoving,
  stageMeta,
  workspaceId,
  pipelineId,
  assignedUserId,
}) => {
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<DealListItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleDealClick = (deal: DealListItem) => {
    setSelectedDeal(deal);
    setDetailsModalOpen(true);
  };

  const handleDragLeave = (stageId: string) => (e: React.DragEvent) => {
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      return;
    }
    setDragOverStage((curr) => (curr === stageId ? null : curr));
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex items-start gap-4 h-[calc(100vh-220px)] w-max pr-2">
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              onMoveDeal={onMoveDeal}
              isMoving={isMoving}
              stageMeta={stageMeta?.[stage.id]}
              workspaceId={workspaceId}
              onDealClick={handleDealClick}
              dragOverStage={dragOverStage}
              onDragEnter={() => setDragOverStage(stage.id)}
              onDragLeave={handleDragLeave(stage.id)}
              assignedUserId={assignedUserId}
            />
          ))}
        </div>
      </div>

      {workspaceId && (
        <DealViewModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          deal={selectedDeal}
          workspaceId={workspaceId}
          pipelineId={pipelineId}
        />
      )}
    </>
  );
};

export default KanbanBoard;
