import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import { listTags } from "@/services/tag/listTags";
import { Tag } from "@/types/tag";
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
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch tags
  const { data: allTags = [], isLoading } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  // Filter tags by search term
  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) return allTags;
    const term = searchTerm.toLowerCase();
    return allTags.filter((tag) => tag.name.toLowerCase().includes(term));
  }, [allTags, searchTerm]);

  // Get selected tags
  const selectedTags = useMemo(() => {
    return allTags.filter((tag) => selectedTagIds.includes(tag.id));
  }, [allTags, selectedTagIds]);

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectionChange([...selectedTagIds, tagId]);
    }
  };

  // Remove specific tag
  const removeTag = (tagId: string) => {
    onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
  };

  // Clear all
  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {/* Tag Selection Popover */}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="flex flex-col">
              {/* Search */}
              <div className="p-2 border-b">
                <Input
                  placeholder="Buscar tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
              </div>

              {/* Tag List */}
              <div className="max-h-60 overflow-y-auto p-2">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Carregando tags...
                  </div>
                ) : filteredTags.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    {searchTerm
                      ? "Nenhuma tag encontrada"
                      : "Nenhuma tag disponível"}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredTags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={() => toggleTag(tag.id)}
                        />
                        <Badge
                          style={{ backgroundColor: tag.color }}
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All Button */}
        {selectedTags.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border rounded-md bg-background">
        {selectedTags.length === 0 ? (
          <span className="text-sm text-muted-foreground">{emptyMessage}</span>
        ) : (
          selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: tag.color }}
              className="gap-1 pr-1"
            >
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag.id);
                }}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
