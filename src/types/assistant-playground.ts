import { TransitionDecisionMode } from "./agent";

export type TransitionDecisionResult =
  | "SKIPPED_NO_RULES"
  | "SKIPPED_REQUIRED_FIELDS"
  | "NO_MATCH"
  | "AMBIGUOUS"
  | "MOVED"
  | "MOVE_REJECTED"
  | "EVALUATION_ERROR";
export type PlaygroundRecord = Record<string, unknown>;
export type PlaygroundScenario = {
  customer: { name: string; email?: string; customFields?: PlaygroundRecord };
  deal: { id?: string; title?: string } | null;
  stage: {
    id?: string;
    name: string;
    requiredFields: PlaygroundRecord[];
    allowedTargetStages: PlaygroundRecord[];
  };
  fields: PlaygroundRecord;
  followUps: PlaygroundRecord[];
  calendar: {
    active: boolean;
    events: PlaygroundRecord[];
    availability: PlaygroundRecord[];
  };
};
export type PlaygroundConfiguration =
  | { mode: "saved"; assistantId: string }
  | {
      mode: "saved_with_overrides";
      assistantId: string;
      overrides: PlaygroundRecord;
    }
  | { mode: "draft"; assistant: PlaygroundRecord };
export type PlaygroundDiagnostic = {
  message: string;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: PlaygroundRecord;
    validatedArguments: PlaygroundRecord;
    result: PlaygroundRecord;
    durationMs: number;
    stateChanged: boolean;
  }>;
  warnings: string[];
  latencies: { totalMs?: number };
  decision: PlaygroundRecord | null;
  errors?: Array<{ code: string; message: string }>;
};
export type PlaygroundSession = {
  id: string;
  configuration: {
    mode: "saved" | "saved_with_overrides" | "draft";
    assistantId?: string;
  };
  initialScenario: PlaygroundScenario;
  simulatedState: PlaygroundScenario;
  transcript: Array<{
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;
  diagnostics: PlaygroundDiagnostic[];
  promptSections?: PlaygroundRecord;
  createdAt: string;
};
export type PlaygroundTurnResult = {
  visibleResponse: string;
  transcript: PlaygroundSession["transcript"];
  simulatedToolCalls: PlaygroundDiagnostic["toolCalls"];
  promptSections: PlaygroundRecord;
  availableTools: PlaygroundRecord[];
  decision: PlaygroundRecord | null;
  stateBefore: PlaygroundRecord;
  stateAfter: PlaygroundRecord;
  latencies: { totalMs?: number };
  warnings: string[];
  errors: Array<{ code: string; message: string }>;
};
export type AssistantTransitionDecision = {
  id: string;
  mode: TransitionDecisionMode;
  result: TransitionDecisionResult;
  dealId: string | null;
  currentStageId: string | null;
  context: string;
  evaluatedRuleIds: string[];
  evidence: string[];
  missingCriteria: string[];
  messageIds: string[];
  model: string | null;
  provider: "OPENAI" | "ANTHROPIC" | null;
  latencyMs: number | null;
  error: string | null;
  createdAt: string;
  expiresAt: string;
};
export type TransitionDecisionPage = {
  items: AssistantTransitionDecision[];
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
};
