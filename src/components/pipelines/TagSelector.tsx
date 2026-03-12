import { useQuery } from "@tanstack/react-query";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { listTags } from "@/services/tag/listTags";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  workspaceId: string;
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function TagSelector({
  workspaceId,
  selectedTagIds,
  onSelectionChange,
  label = "Tags",
  placeholder = "Selecionar tags...",
  emptyMessage = "Nenhuma tag selecionada",
  className,
}: TagSelectorProps) {
  // Fetch tags
  const { data: allTags = [], isLoading } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  const options: Option[] = allTags.map((tag) => ({
    value: tag.id,
    label: tag.name,
    color: tag.color,
  }));

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-2 border rounded-md">
          Carregando tags...
        </div>
      ) : (
        <MultiSelect
          options={options}
          selected={selectedTagIds}
          onChange={onSelectionChange}
          placeholder={selectedTagIds.length === 0 ? placeholder : undefined}
          renderOption={(option) => (
            <Badge style={{ backgroundColor: option.color }}>
              {option.label}
            </Badge>
          )}
          renderSelection={(selectedOptions) => (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  {emptyMessage}
                </span>
              ) : (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    style={{ backgroundColor: option.color }}
                    className="gap-1 pr-1"
                  >
                    <span>{option.label}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectionChange(
                          selectedTagIds.filter((id) => id !== option.value),
                        );
                      }}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}
