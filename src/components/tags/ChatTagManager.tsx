import React, { useState, useEffect } from "react";
import { Tag, X, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { Tag as TagType } from "@/types/tag";
import { listTags } from "@/services/tag/listTags";
import { linkTagToChat } from "@/services/tag/linkTagToChat";
import { unlinkTagFromChat } from "@/services/tag/unlinkTagFromChat";
import { getChatTags } from "@/services/tag/getChatTags";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { isColorDark } from "@/lib/utils";

type ChatTagManagerProps = {
  chatId: string;
  initialChatTags?: TagType[];
  onTagsChange: (tags: TagType[]) => void;
};

export const ChatTagManager: React.FC<ChatTagManagerProps> = ({
  chatId,
  initialChatTags = [],
  onTagsChange,
}) => {
  const { toast } = useToast();
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [removingTagIds, setRemovingTagIds] = useState<string[]>([]);
  const [chatTags, setChatTags] = useState<TagType[]>(initialChatTags);

  const { workspaceId } = useWorkspaceManager();
  const queryClient = useQueryClient();

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

  const linkTagMutation = useMutation({
    mutationFn: linkTagToChat,
    onSuccess: () => {
      const tagToAdd = allTags.find((tag) => tag.id === selectedTagId);
      if (tagToAdd) {
        const updatedTags = [...chatTags, tagToAdd];
        setChatTags(updatedTags);
        onTagsChange(updatedTags);
        setSelectedTagId("");
        queryClient.invalidateQueries({ queryKey: ["chatTags", chatId] });
      }
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar tag",
        description: "Não foi possível adicionar a tag à conversa.",
        variant: "destructive",
      });
    },
  });

  const unlinkTagMutation = useMutation({
    mutationFn: unlinkTagFromChat,
    onSuccess: (_, variables) => {
      const updatedTags = chatTags.filter((tag) => tag.id !== variables.tagId);
      setChatTags(updatedTags);
      onTagsChange(updatedTags);
      setRemovingTagIds((prev) => prev.filter((id) => id !== variables.tagId));
      queryClient.invalidateQueries({ queryKey: ["chatTags", chatId] });
    },
    onError: () => {
      toast({
        title: "Erro ao remover tag",
        description: "Não foi possível remover a tag da conversa.",
        variant: "destructive",
      });
      setRemovingTagIds((prev) =>
        prev.filter((id) => id !== unlinkTagMutation.variables?.tagId)
      );
    },
  });

  const handleAddTag = () => {
    if (!selectedTagId) return;

    linkTagMutation.mutate({
      tagId: selectedTagId,
      chatId,
      workspaceId: workspaceId || "",
    });
  };

  const handleRemoveTag = (tagId: string) => {
    setRemovingTagIds((prev) => [...prev, tagId]);
    unlinkTagMutation.mutate({
      tagId,
      chatId,
      workspaceId: workspaceId || "",
    });
  };

  // Atualizar chatTags quando fetchedChatTags mudar
  useEffect(() => {
    if (fetchedChatTags) {
      setChatTags(fetchedChatTags);
      onTagsChange(fetchedChatTags);
    }
  }, [fetchedChatTags, onTagsChange]);

  // Filtrar tags que ainda não foram adicionadas
  const availableTags = allTags.filter(
    (tag) => !chatTags.some((chatTag) => chatTag.id === tag.id)
  );

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Tags</h4>

      <div className="flex flex-wrap gap-2 mb-4">
        {isLoadingChatTags && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando tags...
          </div>
        )}
        {chatTags.length > 0 ? (
          chatTags.map((tag) => (
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
                disabled={removingTagIds.includes(tag.id)}
              >
                {removingTagIds.includes(tag.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span className="sr-only">Remover tag</span>
              </button>
            </Badge>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">
            Nenhuma tag adicionada
          </div>
        )}
      </div>

      {availableTags.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedTagId} onValueChange={setSelectedTagId}>
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
            disabled={!selectedTagId || linkTagMutation.isPending}
            isLoading={linkTagMutation.isPending}
          >
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
};
