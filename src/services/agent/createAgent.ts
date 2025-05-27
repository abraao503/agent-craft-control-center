import { CreateAgentRequest } from "@/types/agent";
import { api } from "../api";

export const createAgent = async (
  agentData: CreateAgentRequest
): Promise<CreateAgentRequest> => {
  await api.post("assistant", agentData);

  return agentData;
};
