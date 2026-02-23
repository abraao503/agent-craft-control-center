import React, { useRef, useState } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Tag } from "@/types/tag";
import { isColorDark } from "@/lib/utils";
import { CreateTagDialog } from "@/components/tags/CreateTagDialog";
import { useQuery } from "@tanstack/react-query";
import { listTags } from "@/services/tag/listTags";

interface TagsSelectorProps {
  allTags: Tag[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  onSave: (tagIds: string[]) => void;
  isLoading: boolean;
  workspaceId: string;
}

export const TagsSelector: React.FC<TagsSelectorProps> = ({
  allTags,
  selectedTagIds,
  onTagsChange,
  onSave,
  isLoading,
  workspaceId,
}) => {
  const previousOpenRef = useRef(false);
  const initialTagsRef = useRef<string[]>(selectedTagIds);
  const isCreatingRef = useRef(false);
  const justSucceededRef = useRef(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchTags = [] } = useQuery({
    queryKey: ["tags", workspaceId, debouncedSearch],
    queryFn: () => listTags(workspaceId, debouncedSearch),
    enabled: !!workspaceId && debouncedSearch.trim().length > 0,
  });

  const combinedTags = React.useMemo(() => {
    const map = new Map<string, Tag>();
    allTags.forEach(t => map.set(t.id, t));
    searchTags.forEach(t => map.set(t.id, t));
    return Array.from(map.values());
  }, [allTags, searchTags]);

  // Update initial tags when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Popover just opened - save current state
      initialTagsRef.current = selectedTagIds;
    } else if (previousOpenRef.current) {
      // Popover just closed
      if (!isCreatingRef.current) {
        // check if changed and save only if we aren't opening the create dialog
        const hasChanged =
          selectedTagIds.length !== initialTagsRef.current.length ||
          selectedTagIds.some((id) => !initialTagsRef.current.includes(id));

        if (hasChanged) {
          onSave(selectedTagIds);
        }
      }
    }
    previousOpenRef.current = isOpen;
  };

  return (
    <>
      <MultiSelect
        options={combinedTags.map((tag) => ({
          value: tag.id,
          label: tag.name,
          color: tag.color,
        }))}
        placeholder="Selecione as tags"
        selected={selectedTagIds}
        onChange={onTagsChange}
        onOpenChange={handleOpenChange}
        onSearchChange={setSearchTerm}
        onCreate={(value) => {
          setNewTagName(value);
          isCreatingRef.current = true;
          setCreateDialogOpen(true);
        }}
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
              const tag = combinedTags.find((t) => t.id === option.value);
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Atualizando tags...
        </div>
      )}
      <CreateTagDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            if (justSucceededRef.current) {
              // Dialog closing naturally after successful creation, state already saved in onSuccess
              justSucceededRef.current = false;
            } else {
              // User canceled, check if tags changed before they canceled creating a tag
              const hasChanged =
                selectedTagIds.length !== initialTagsRef.current.length ||
                selectedTagIds.some((id) => !initialTagsRef.current.includes(id));
              if (hasChanged) {
                 onSave(selectedTagIds);
                 initialTagsRef.current = selectedTagIds; // Update so we don't save twice
              }
            }
            // Add a small delay so popover state settles before clearing ref
            setTimeout(() => {
              isCreatingRef.current = false;
            }, 100);
          }
        }}
        workspaceId={workspaceId}
        initialName={newTagName}
        onSuccess={(tag) => {
          justSucceededRef.current = true;
          const newIds = [...selectedTagIds, tag.id];
          onTagsChange(newIds);
          onSave(newIds);
          initialTagsRef.current = newIds;
        }}
      />
    </>
  );
};
