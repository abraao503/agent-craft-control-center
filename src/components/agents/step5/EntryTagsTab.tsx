import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { AgentFormData } from "@/types/agent";
import { Tag } from "@/types/tag";
import { listTags } from "@/services/tag/listTags";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { isColorDark } from "@/lib/utils";

interface EntryTagsTabProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

const EntryTagsTab: React.FC<EntryTagsTabProps> = ({ formData, updateFormData }) => {
  const { workspaceId } = useWorkspaceManager();
  
  // Buscar todas as tags disponíveis
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId),
    enabled: !!workspaceId,
  });

  const handleTagsChange = (tagIds: string[]) => {
    updateFormData({ entryTags: tagIds });
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tags de Entrada</CardTitle>
          <CardDescription>
            Selecione as tags que serão automaticamente adicionadas aos novos chats criados por este agente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm font-medium">Tags de Entrada</div>
            <MultiSelect
              options={tags.map((tag) => ({
                value: tag.id,
                label: tag.name,
                color: tag.color,
              }))}
              placeholder="Selecione as tags de entrada"
              selected={formData.entryTags}
              onChange={handleTagsChange}
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
                    const tag = tags.find((t) => t.id === option.value);
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
            <p className="text-sm text-muted-foreground mt-1">
              Essas tags serão automaticamente adicionadas aos novos chats criados por este agente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EntryTagsTab;
