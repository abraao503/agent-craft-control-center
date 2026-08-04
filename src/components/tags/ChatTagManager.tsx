import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Tag as TagType } from "@/types/tag";
import { listTags } from "@/services/tag/listTags";
import { linkTagToChat } from "@/services/tag/linkTagToChat";
import { unlinkTagFromChat } from "@/services/tag/unlinkTagFromChat";
import { getChatTags } from "@/services/tag/getChatTags";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { TagsSelector } from "./TagsSelector";

type ChatTagManagerProps = {
  chatId: string;
  initialChatTags?: TagType[];
  onTagsChange: (tags: TagType[]) => void;
  showLabel?: boolean;
};

export const ChatTagManager: React.FC<ChatTagManagerProps> = ({
  chatId,
  initialChatTags = [],
  onTagsChange,
  showLabel = true,
}) => {
  const { toast } = useToast();
  const { workspaceId } = useWorkspaceManager();
  const queryClient = useQueryClient();

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialChatTags.map((t) => t.id)
  );
  const initialTagIds = initialChatTags.map((tag) => tag.id).join(",");

  useEffect(() => {
    setSelectedTagIds(initialTagIds ? initialTagIds.split(",") : []);
  }, [chatId, initialTagIds]);

  const { data: allTags = [] } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => listTags(workspaceId || ""),
    enabled: !!workspaceId,
  });

  const { data: fetchedChatTags, isLoading: isLoadingChatTags } = useQuery({
    queryKey: ["chatTags", chatId, workspaceId],
    queryFn: () => getChatTags(chatId, workspaceId || ""),
    enabled: !!chatId && !!workspaceId,
  });

  useEffect(() => {
    if (fetchedChatTags) {
      setSelectedTagIds(fetchedChatTags.map((t) => t.id));
      onTagsChange(fetchedChatTags);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedChatTags]);

  const saveTagsMutation = useMutation({
    mutationFn: async (newTagIds: string[]) => {
      const currentTagIds = fetchedChatTags?.map((t) => t.id) || [];
      const tagsToAdd = newTagIds.filter((id) => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter((id) => !newTagIds.includes(id));

      await Promise.all([
        ...tagsToAdd.map((tagId) =>
          linkTagToChat({ tagId, chatId, workspaceId: workspaceId || "" })
        ),
        ...tagsToRemove.map((tagId) =>
          unlinkTagFromChat({ tagId, chatId, workspaceId: workspaceId || "" })
        ),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatTags", chatId] });
    },
    onError: () => {
      const previousTags = fetchedChatTags || initialChatTags;
      setSelectedTagIds(previousTags.map((tag) => tag.id));
      onTagsChange(previousTags);
      toast({
        title: "Erro ao atualizar tags",
        description: "Houve um erro ao sincronizar as tags da conversa.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-2">
      {showLabel && <h4 className="text-sm font-medium">Tags</h4>}
      <TagsSelector
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        onTagsChange={(newIds) => {
          setSelectedTagIds(newIds);
          // Atualiza instantaneamente o front-end mapeando os IDs para Objetos Tag
          const combinedTags = [...allTags, ...(fetchedChatTags || [])];
          const newTagsData = newIds
            .map((id) => combinedTags.find((t) => t.id === id))
            .filter((t): t is TagType => !!t);
          
          // Remove duplicatas caso allTags e fetchedChatTags possuam os mesmos objetos
          const uniqueTags = Array.from(new Map(newTagsData.map(item => [item.id, item])).values());
          onTagsChange(uniqueTags);
        }}
        onSave={(newIds) => saveTagsMutation.mutate(newIds)}
        isLoading={saveTagsMutation.isPending || isLoadingChatTags}
        workspaceId={workspaceId || ""}
      />
    </div>
  );
};
