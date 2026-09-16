import { api } from "@/services/api";
import {
  OperationalClaraConfiguration,
  UpdateOperationalClaraConfigurationBody,
} from "@/types/operation-assistant";

export async function updateOperationalClaraConfiguration(params: {
  workspaceId: string;
  body: UpdateOperationalClaraConfigurationBody;
}): Promise<OperationalClaraConfiguration> {
  const { data } = await api.put<OperationalClaraConfiguration>(
    `/operation/workspaces/${params.workspaceId}/clara`,
    params.body,
  );

  return data;
}
