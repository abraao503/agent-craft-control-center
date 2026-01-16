import React, { useRef } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Tag } from "@/types/tag";
import { isColorDark } from "@/lib/utils";

interface DealTagsSelectorProps {
  allTags: Tag[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  onSave: (tagIds: string[]) => void;
  isLoading: boolean;
}

export const DealTagsSelector: React.FC<DealTagsSelectorProps> = ({
  allTags,
  selectedTagIds,
  onTagsChange,
  onSave,
  isLoading,
}) => {
  const previousOpenRef = useRef(false);
  const initialTagsRef = useRef<string[]>(selectedTagIds);

  // Update initial tags when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Popover just opened - save current state
      initialTagsRef.current = selectedTagIds;
    } else if (previousOpenRef.current) {
      // Popover just closed - check if changed and save
      const hasChanged =
        selectedTagIds.length !== initialTagsRef.current.length ||
        selectedTagIds.some((id) => !initialTagsRef.current.includes(id));

      if (hasChanged) {
        onSave(selectedTagIds);
      }
    }
    previousOpenRef.current = isOpen;
  };

  return (
    <>
      <MultiSelect
        options={allTags.map((tag) => ({
          value: tag.id,
          label: tag.name,
          color: tag.color,
        }))}
        placeholder="Selecione as tags"
        selected={selectedTagIds}
        onChange={onTagsChange}
        onOpenChange={handleOpenChange}
        renderOption={(option) => (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: option.color }}
            />
            {option.label}
          </div>
        )}
        renderSelection={(selected) => (
          <div className="flex flex-wrap gap-1">
            {selected.map((option) => {
              const tag = allTags.find((t) => t.id === option.value);
              if (!tag) return null;

              return (
                <Badge
                  key={tag.id}
                  style={{
                    backgroundColor: tag.color,
                    color: isColorDark(tag.color) ? "white" : "black",
                  }}
                  className="flex items-center gap-1"
                >
                  {tag.name}
                </Badge>
              );
            })}
          </div>
        )}
      />
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Atualizando tags...
        </div>
      )}
    </>
  );
};
