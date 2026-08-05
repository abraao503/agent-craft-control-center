import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConversationsFilters } from "@/types/conversation";
import { PipelineListItem, PipelineStageMinimal } from "@/types/pipeline";
import { Tag } from "@/types/tag";
import { User } from "@/types/user";

type Props = {
  filters: ConversationsFilters;
  onChange: (patch: Partial<ConversationsFilters>) => void;
  isSalesRep: boolean;
  users: User[];
  pipelines: PipelineListItem[];
  stages: PipelineStageMinimal[];
  tags: Tag[];
};

export function ChatInboxFilters({
  filters,
  onChange,
  isSalesRep,
  users,
  pipelines,
  stages,
  tags,
}: Props) {
  const activeFilterCount = [
    filters.handledBy,
    filters.pipelineId,
    filters.stageId,
    filters.tagIds?.length ? filters.tagIds : undefined,
    filters.initialDate,
    filters.finalDate,
    filters.onlyUnread ? true : undefined,
    filters.sortOrder === "asc" ? filters.sortOrder : undefined,
  ].filter(Boolean).length;

  const clearSecondaryFilters = () =>
    onChange({
      handledBy: undefined,
      pipelineId: undefined,
      stageId: undefined,
      tagIds: [],
      initialDate: undefined,
      finalDate: undefined,
      onlyUnread: false,
      sortOrder: "desc",
    });

  return (
    <div className="flex gap-2 border-b p-3">
      {!isSalesRep && (
        <Select
          value={
            filters.assignmentScope === "user"
              ? filters.assignedUserId
              : filters.assignmentScope
          }
          onValueChange={(value) =>
            onChange(
              ["all", "mine", "unassigned"].includes(value)
                ? {
                    assignmentScope: value as "all" | "mine" | "unassigned",
                    assignedUserId: undefined,
                  }
                : { assignmentScope: "user", assignedUserId: value },
            )
          }
        >
          <SelectTrigger className="min-w-0 flex-1">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="mine">Meus</SelectItem>
            <SelectItem value="unassigned">Não atribuídos</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={isSalesRep ? "w-full justify-center" : "shrink-0"}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 min-w-5 justify-center px-1.5"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[340px] space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Filtrar conversas</p>
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={clearSecondaryFilters}
              >
                Limpar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={filters.handledBy ?? "all"}
              onValueChange={(value) =>
                onChange({
                  handledBy:
                    value === "all"
                      ? undefined
                      : (value as "assistant" | "human"),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Atendimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">IA e humano</SelectItem>
                <SelectItem value="assistant">IA</SelectItem>
                <SelectItem value="human">Humano</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.onlyUnread ? "unread" : "all"}
              onValueChange={(value) =>
                onChange({ onlyUnread: value === "unread" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={filters.pipelineId ?? "all"}
              onValueChange={(value) =>
                onChange({
                  pipelineId: value === "all" ? undefined : value,
                  stageId: undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas pipelines</SelectItem>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.stageId ?? "all"}
              onValueChange={(value) =>
                onChange({ stageId: value === "all" ? undefined : value })
              }
              disabled={!filters.pipelineId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas etapas</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MultiSelect
            options={tags.map((tag) => ({
              value: tag.id,
              label: tag.name,
              color: tag.color,
            }))}
            selected={filters.tagIds ?? []}
            onChange={(tagIds) => onChange({ tagIds })}
            placeholder="Tags"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium">Período</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                aria-label="Data inicial"
                value={filters.initialDate ? toDateInput(filters.initialDate) : ""}
                onChange={(event) =>
                  onChange({
                    initialDate: event.target.value
                      ? new Date(`${event.target.value}T00:00:00`)
                      : undefined,
                  })
                }
              />
              <Input
                type="date"
                aria-label="Data final"
                value={filters.finalDate ? toDateInput(filters.finalDate) : ""}
                onChange={(event) =>
                  onChange({
                    finalDate: event.target.value
                      ? new Date(`${event.target.value}T23:59:59`)
                      : undefined,
                  })
                }
              />
            </div>
          </div>

          <Select
            value={filters.sortOrder}
            onValueChange={(value) =>
              onChange({ sortOrder: value as "asc" | "desc" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mais recentes</SelectItem>
              <SelectItem value="asc">Mais antigas</SelectItem>
            </SelectContent>
          </Select>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function toDateInput(date: Date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
