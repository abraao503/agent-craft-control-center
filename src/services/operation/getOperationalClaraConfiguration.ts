import { api } from "@/services/api";
import { OperationalClaraConfiguration } from "@/types/operation-assistant";

export async function getOperationalClaraConfiguration(
  workspaceId: string,
): Promise<OperationalClaraConfiguration> {
  const { data } = await api.get<OperationalClaraConfiguration>(
    `/operation/workspaces/${workspaceId}/clara`,
  );

  return data;
}
