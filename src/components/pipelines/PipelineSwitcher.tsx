import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Pencil, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { useTranslation } from "react-i18next";

interface PipelineSwitcherProps {
  workspaceId: string;
  currentPipelineId?: string;
  onSelect: (pipelineId: string) => void;
  onEditCurrent: () => void;
  onCreateNew: () => void;
  canEdit?: boolean;
  canCreate?: boolean;
}

export const PipelineSwitcher: React.FC<PipelineSwitcherProps> = ({
  workspaceId,
  currentPipelineId,
  onSelect,
  onEditCurrent,
  onCreateNew,
  canEdit = false,
  canCreate = false,
}) => {
  const { t } = useTranslation();
  const { data: pipelines = [] } = useQuery({
    queryKey: ["listPipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId),
    enabled: !!workspaceId,
  });

  const current = useMemo(
    () => pipelines.find((p) => p.id === currentPipelineId),
    [pipelines, currentPipelineId],
  );

  const emptyMessage = canCreate ? t("deals.noPipeline") : t("deals.noAssignedDeals");

  return (
    <div className="inline-flex rounded-md shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 rounded-r-none border-r-0">
            <span className="max-w-[220px] truncate">
              {current?.name || t("deals.selectPipelineShort")}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>{t("common.pipeline")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={currentPipelineId}
            onValueChange={onSelect}
          >
            {pipelines.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                {emptyMessage}
              </p>
            ) : (
              pipelines.map((p) => (
                <DropdownMenuRadioItem key={p.id} value={p.id}>
                  {p.name}
                </DropdownMenuRadioItem>
              ))
            )}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {canCreate && (
                <DropdownMenuItem onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" /> {t("pipelines.create")}
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {canEdit && (
        <Button
          variant="outline"
          size="icon"
          className="rounded-l-none border-l"
          onClick={onEditCurrent}
          aria-label={t("common.edit")}
          title={t("common.edit")}
          disabled={!currentPipelineId}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PipelineSwitcher;
