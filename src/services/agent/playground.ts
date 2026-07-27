import { api } from "../api";
import {
  PlaygroundConfiguration,
  PlaygroundScenario,
  PlaygroundSession,
  PlaygroundTurnResult,
  TransitionDecisionPage,
  TransitionDecisionResult,
} from "@/types/assistant-playground";

export const createPlaygroundSession = async (payload: {
  workspaceId?: string;
  configuration: PlaygroundConfiguration;
  scenario?: PlaygroundScenario;
}) =>
  (await api.post<PlaygroundSession>("/assistant/playground/sessions", payload))
    .data;
export const getPlaygroundSession = async (id: string) =>
  (await api.get<PlaygroundSession>(`/assistant/playground/sessions/${id}`))
    .data;
export const updatePlaygroundScenario = async (
  id: string,
  scenario: PlaygroundScenario,
) =>
  (
    await api.patch<PlaygroundSession>(
      `/assistant/playground/sessions/${id}/scenario`,
      scenario,
    )
  ).data;
export const sendPlaygroundMessage = async (
  id: string,
  message: string,
  apiKey?: string,
) =>
  (
    await api.post<PlaygroundTurnResult>(
      `/assistant/playground/sessions/${id}/messages`,
      { message, ...(apiKey ? { apiKey } : {}) },
    )
  ).data;
export const resetPlaygroundSession = async (id: string) =>
  (
    await api.post<PlaygroundSession>(
      `/assistant/playground/sessions/${id}/reset`,
    )
  ).data;
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
