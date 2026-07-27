import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { AgentFormData } from "@/types/agent";
import { Tag as TagIcon, Tags } from "lucide-react";
import { Tag } from "@/types/tag";
import { listTags } from "@/services/tag/listTags";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { isColorDark } from "@/lib/utils";

interface EntryTagsCardProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

export const EntryTagsCard: React.FC<EntryTagsCardProps> = ({
  formData,
  updateFormData,
}) => {
  const { workspaceId } = useWorkspaceManager();

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId || ""),
    enabled: !!workspaceId,
  });

  const handleTagsChange = (tagIds: string[]) => {
    updateFormData({ entryTags: tagIds });
  };

  const selectedTags = tags.filter((tag) =>
    formData.entryTags?.includes(tag.id),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Tags de Entrada</CardTitle>
              <CardDescription>
                Tags automáticas para novos chats criados por este agente
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <MultiSelect
              options={tags.map((tag) => ({
                value: tag.id,
                label: tag.name,
                color: tag.color,
              }))}
              placeholder="Selecione as tags..."
              selected={formData.entryTags}
              onChange={handleTagsChange}
              renderOption={(option) => (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                  <span>{option.label}</span>
                </div>
              )}
              renderSelection={(selected) => (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((option) => {
                    const tag = tags.find((t) => t.id === option.value);
                    if (!tag) return null;

                    return (
                      <Badge
                        key={tag.id}
                        style={{
                          backgroundColor: tag.color,
                          color: isColorDark(tag.color) ? "white" : "black",
                        }}
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Essas tags serão adicionadas automaticamente a todos os chats
              iniciados pelo agente
            </p>
          </div>

          {selectedTags.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Tags className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Tags Selecionadas ({selectedTags.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm font-medium">{tag.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
