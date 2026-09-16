import { createOperationalAssistant } from "@/services/operation/createOperationalAssistant";
import { listOperationalAssistantOptions } from "@/services/operation/listOperationalAssistantOptions";
import { getOperationalClaraConfiguration } from "@/services/operation/getOperationalClaraConfiguration";
import type {
  OperationalAssistantCreateBody,
  OperationalAssistantOption,
} from "@/types/operation-assistant";

const workspaceId = "00000000-0000-0000-0000-000000000000";

const assistantBody: OperationalAssistantCreateBody = {
  name: "Clara operacional",
  description: "Atende clientes no fluxo operacional.",
  avatarFileId: null,
  timeZone: "America/Sao_Paulo",
  language: "pt-BR",
  iaModelId: "00000000-0000-0000-0000-000000000001",
  prompt: {
    function: "Realizar a triagem inicial do atendimento.",
    style: "Objetivo, cordial e direto.",
    instructions: "Use somente as informações disponíveis no contexto.",
    blacklist: null,
    links: null,
  },
  contentIds: [],
  providerCredential: "credential-for-test",
  audioTranscriptionEnabled: false,
  contextWindowTurns: 20,
  claudeResponseProfile: "balanced",
};

async function operationalAssistantHttpContract(): Promise<void> {
  const created = await createOperationalAssistant({
    workspaceId,
    body: assistantBody,
  });
  const options = await listOperationalAssistantOptions(workspaceId);
  const clara = await getOperationalClaraConfiguration(workspaceId);

  const option: OperationalAssistantOption | undefined = options.items[0];
  void created;
  void clara;
  void option;
}

void operationalAssistantHttpContract;
