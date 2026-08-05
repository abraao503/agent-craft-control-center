import { api } from "../api";
import {
  PlaygroundConfiguration,
  PlaygroundScenario,
  PlaygroundSession,
  PlaygroundTurnResult,
  TransitionDecisionPage,
  TransitionDecisionResult,
} from "@/types/assistant-playground";
import { AgentFormData } from "@/types/agent";

const withoutSecrets = <T extends Record<string, unknown>>(value: T): T => {
  const result = { ...value };
  delete result.iaProviderApiKey;
  delete result.apiKey;
  delete result.secret;
  delete result.token;
  return result;
};

/** Converts editor state into a safe, ephemeral playground configuration. */
export const toPlaygroundAssistantConfig = (form: AgentFormData) =>
  withoutSecrets({
    name: form.name,
    description: form.description,
    language: form.language,
    timeZone: form.timeZone,
    iaModel: { name: form.iaModelId },
    prompt: {
      function: form.function,
      style: form.style,
      instructions: form.instructions,
      blacklist: form.blacklist,
      links: form.links,
    },
    customFields: form.customFields,
    followUps: form.followUps,
    transitionDecisionMode: form.transitionDecisionMode,
  });

export const createPlaygroundSession = async (payload: {
  workspaceId?: string;
  configuration: PlaygroundConfiguration;
  scenario?: PlaygroundScenario;
}) =>
  (await api.post<PlaygroundSession>("/assistant/playground/sessions", payload))
    .data;
export const getPlaygroundSession = async (id: string, workspaceId: string) =>
  (
    await api.get<PlaygroundSession>(`/assistant/playground/sessions/${id}`, {
      params: { workspaceId },
    })
  ).data;
export const updatePlaygroundScenario = async (
  id: string,
  scenario: PlaygroundScenario,
  workspaceId: string,
) =>
  (
    await api.patch<PlaygroundSession>(
      `/assistant/playground/sessions/${id}/scenario`,
      scenario,
      { params: { workspaceId } },
    )
  ).data;
export const sendPlaygroundMessage = async (
  id: string,
  message: string,
  workspaceId: string,
  apiKey?: string,
) =>
  (
    await api.post<PlaygroundTurnResult>(
      `/assistant/playground/sessions/${id}/messages`,
      { message, ...(apiKey ? { apiKey } : {}) },
      { params: { workspaceId } },
    )
  ).data;
export const resetPlaygroundSession = async (id: string, workspaceId: string) =>
  (
    await api.post<PlaygroundSession>(
      `/assistant/playground/sessions/${id}/reset`,
      undefined,
      { params: { workspaceId } },
    )
  ).data;
export const deletePlaygroundSession = async (id: string) => {
  await api.delete(`/assistant/playground/sessions/${id}`);
};
export const listTransitionDecisions = async (
  assistantId: string,
  params: {
    workspaceId: string;
    page?: number;
    limit?: number;
    dealId?: string;
    mode?: string;
    result?: TransitionDecisionResult;
    currentStageId?: string;
    from?: string;
    to?: string;
  },
) =>
  (
    await api.get<TransitionDecisionPage>(
      `/assistant/${assistantId}/transition-decisions`,
      { params },
    )
  ).data;
