import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  syncMetaCloudTemplates,
  syncOperationalMetaAccountTemplates,
  type SyncMetaCloudTemplatesParams,
} from "@/services/whatsapp/metaCloud";
import { metaTemplateSyncError } from "@/utils/metaTemplateSyncError";

export function useSyncMetaTemplates(
  workspaceId?: string,
  operationalAccount = false,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationKey: ["sync-meta-templates", workspaceId],
    mutationFn: (params: Omit<SyncMetaCloudTemplatesParams, "workspaceId"> = {}) => {
      if (operationalAccount) {
        if (!workspaceId || !params.wabaId) {
          throw new Error("Conta Meta não selecionada");
        }
        return syncOperationalMetaAccountTemplates(workspaceId, params.wabaId);
      }
      return syncMetaCloudTemplates({ ...params, workspaceId });
    },
    onSuccess: async (templates) => {
      await Promise.all([
        ...[
          "meta-cloud-templates",
          "metaCloudPipelineTemplates",
          "meta-chat-templates",
        ].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
        queryClient.invalidateQueries({
          queryKey: ["operation", "attendance-templates"],
        }),
      ]);
      toast({
        title: "Modelos sincronizados",
        description: templates.length
          ? `${templates.length} ${templates.length === 1 ? "modelo aprovado importado" : "modelos aprovados importados"}.`
          : "A Meta não retornou modelos aprovados para esta conta.",
      });
    },
    onError: (error: unknown) =>
      toast({
        title: "Não foi possível sincronizar os modelos",
        description: metaTemplateSyncError(error),
        variant: "destructive",
      }),
  });
}
