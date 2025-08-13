import { FollowUp } from "@/types/follow-up";
import { FollowUpCard } from "./FollowUpCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FollowUpWithMessageQueue } from "@/services/follow-up";

interface FollowUpGridProps {
  followUps: FollowUpWithMessageQueue[];
  onEdit: (followUp: FollowUpWithMessageQueue) => void;
  onDelete: (followUp: FollowUpWithMessageQueue) => void;
  isLoadingAction?: boolean;
}

export function FollowUpGrid({
  followUps,
  onEdit,
  onDelete,
  isLoadingAction = false,
}: FollowUpGridProps) {
  if (followUps.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 border rounded-md">
        <p className="text-muted-foreground">Nenhum follow-up encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {followUps.map((followUp) => (
        <TooltipProvider key={followUp.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={isLoadingAction ? "cursor-wait" : ""}>
                <FollowUpCard
                  followUp={followUp}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={isLoadingAction}
                />
              </div>
            </TooltipTrigger>
            {isLoadingAction && (
              <TooltipContent side="top">
                <p>Carregando dados...</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
