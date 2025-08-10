import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { listTags } from "@/services/tag/listTags";
import { Tag } from "@/types/tag";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { isColorDark } from "@/lib/utils";

interface EntryTagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

const EntryTagSelector: React.FC<EntryTagSelectorProps> = ({
  selectedTagIds,
  onTagsChange,
}) => {
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const { workspaceId } = useWorkspaceManager();

  const { data: allTags = [] } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  // Filtrar tags que ainda não foram selecionadas
  const availableTags = allTags.filter(
    (tag) => !selectedTagIds.includes(tag.id)
  );

  // Obter as tags selecionadas completas (com nome, cor, etc.)
  const selectedTags = allTags.filter((tag) => 
    selectedTagIds.includes(tag.id)
  );

  const handleAddTag = () => {
    if (!selectedTagId) return;
    onTagsChange([...selectedTagIds, selectedTagId]);
    setSelectedTagId("");
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter((id) => id !== tagId));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              style={{
                backgroundColor: tag.color,
                color: isColorDark(tag.color) ? "white" : "black",
              }}
              className="flex items-center gap-1"
            >
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover tag</span>
              </button>
            </Badge>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">
            Nenhuma tag selecionada
          </div>
        )}
      </div>

      {availableTags.length > 0 && (
        <div className="flex gap-2">
          <Select
            value={selectedTagId}
            onValueChange={setSelectedTagId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecionar tag" />
            </SelectTrigger>
            <SelectContent>
              {availableTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAddTag}
            disabled={!selectedTagId}
          >
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
};

export default EntryTagSelector;
