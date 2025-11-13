import { GetAgentResponse } from "@/types/agent";
import { api } from "../api";

export const getDeletedAssistant = async (
  pipelineId: string,
  workspaceId: string
): Promise<GetAgentResponse | null> => {
  try {
    const response = await api.get<GetAgentResponse>(
      `/pipeline/${pipelineId}/deleted-assistant`,
      {
        params: {
          workspaceId,
        },
      }
    );

    return response.data;
  } catch (error) {
    // Se retornar 404, significa que não há agente deletado
    if (
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    // Re-throw outros erros
    throw error;
  }
};
