import { Agent } from "@/types/agent";
import { WhatsAppIntegration } from "@/types/whatsapp";
import { IaModel } from "@/types/iaModel";
import { UploadDocumentResponse } from "@/types/file";
import { Conversation } from "@/types/conversation";
import { AGENT_STATUS } from "@/constants/agent";
import { Content } from "@/types/content";

export const AGENT_STATUSES = [
  {
    label: "Ativo",
    value: AGENT_STATUS.ACTIVE,
  },
  {
    label: "Inativo",
    value: AGENT_STATUS.INACTIVE,
  },
];

export const IA_MODELS: IaModel[] = [
  {
    id: "ia-model-1",
    name: "GPT-3",
  },
  {
    id: "ia-model-2",
    name: "GPT-4",
  },
];

export const AGENTS: Agent[] = [
  {
    id: "agent-001",
    name: "HealthBot",
    language: "pt-BR",
    iaModelName: "gpt",
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const CONTENT = [
  {
    id: "content-001",
    title: "Como fazer um bom café",
    content:
      "Para fazer um bom café, você precisa de água quente, café de qualidade e um filtro.",
  },
  {
    id: "content-002",
    title: "Como fazer um bolo de chocolate",
    content:
      "Para fazer um bolo de chocolate, você precisa de farinha, açúcar, chocolate em pó, ovos, leite e fermento.",
  },
];

export const FILES: UploadDocumentResponse[] = [
  {
    id: "file-1",
    name: "Manual do produto.pdf",
  },
  {
    id: "file-2",
    name: "Termos de uso.pdf",
  },
];

// Mock conversations data
export const CONVERSATIONS: Conversation[] = [
  {
    id: "conv-001",
    agentId: "agent-001",
    agentName: "HealthBot",
    customerName: "João Silva",
    lastInteractionAt: "2025-04-25T14:30:00Z",
    handledBy: "ai",
    messages: [
      {
        id: "msg-001",
        content: "Olá, como posso ajudar com sua consulta médica?",
        timestamp: "2025-04-25T14:28:00Z",
        sender: "agent",
      },
      {
        id: "msg-002",
        content: "Preciso marcar uma consulta para amanhã",
        timestamp: "2025-04-25T14:29:00Z",
        sender: "customer",
      },
      {
        id: "msg-003",
        content:
          "Claro! Temos horários disponíveis às 10h e 15h. Qual prefere?",
        timestamp: "2025-04-25T14:30:00Z",
        sender: "agent",
      },
    ],
  },
  {
    id: "conv-002",
    agentId: "agent-002",
    agentName: "TechSupport",
    customerName: "Maria Oliveira",
    lastInteractionAt: "2025-04-24T09:45:00Z",
    handledBy: "human",
    messages: [
      {
        id: "msg-004",
        content: "Bem-vindo ao suporte técnico. Como posso ajudar?",
        timestamp: "2025-04-24T09:40:00Z",
        sender: "agent",
      },
      {
        id: "msg-005",
        content: "Meu laptop não está ligando",
        timestamp: "2025-04-24T09:42:00Z",
        sender: "customer",
      },
      {
        id: "msg-006",
        content:
          "Entendi. Você tentou carregar a bateria por pelo menos 30 minutos?",
        timestamp: "2025-04-24T09:43:00Z",
        sender: "agent",
      },
      {
        id: "msg-007",
        content: "Sim, mas não funcionou",
        timestamp: "2025-04-24T09:44:00Z",
        sender: "customer",
      },
      {
        id: "msg-008",
        content:
          "Este caso parece mais complexo. Um técnico humano assumirá o atendimento agora.",
        timestamp: "2025-04-24T09:45:00Z",
        sender: "agent",
      },
    ],
  },
  {
    id: "conv-003",
    agentId: "agent-003",
    agentName: "SalesBot",
    customerName: "Carlos Mendes",
    lastInteractionAt: "2025-04-23T16:20:00Z",
    handledBy: "ai",
    messages: [
      {
        id: "msg-009",
        content: "Olá! Estou interessado em conhecer seus produtos",
        timestamp: "2025-04-23T16:15:00Z",
        sender: "customer",
      },
      {
        id: "msg-010",
        content:
          "Olá Carlos! Claro, temos vários produtos que podem te interessar. Você procura algo específico?",
        timestamp: "2025-04-23T16:17:00Z",
        sender: "agent",
      },
      {
        id: "msg-011",
        content: "Estou procurando um smartphone novo",
        timestamp: "2025-04-23T16:19:00Z",
        sender: "customer",
      },
      {
        id: "msg-012",
        content:
          "Ótimo! Temos os modelos X2000, Y3000 e Z5000 disponíveis. Qual faixa de preço você está considerando?",
        timestamp: "2025-04-23T16:20:00Z",
        sender: "agent",
      },
    ],
  },
  {
    id: "conv-004",
    agentId: "agent-001",
    agentName: "HealthBot",
    customerName: "Ana Pereira",
    lastInteractionAt: "2025-04-22T10:05:00Z",
    handledBy: "ai",
    messages: [
      {
        id: "msg-013",
        content: "Bom dia, gostaria de informações sobre exames de sangue",
        timestamp: "2025-04-22T10:00:00Z",
        sender: "customer",
      },
      {
        id: "msg-014",
        content:
          "Bom dia, Ana! Claro, posso te ajudar com informações sobre exames de sangue. O que exatamente você gostaria de saber?",
        timestamp: "2025-04-22T10:02:00Z",
        sender: "agent",
      },
      {
        id: "msg-015",
        content: "Preciso saber se preciso estar em jejum",
        timestamp: "2025-04-22T10:04:00Z",
        sender: "customer",
      },
      {
        id: "msg-016",
        content:
          "Para a maioria dos exames de sangue, sim, é recomendado jejum de 8-12 horas. Quais exames específicos você fará?",
        timestamp: "2025-04-22T10:05:00Z",
        sender: "agent",
      },
    ],
  },
  {
    id: "conv-005",
    agentId: "agent-002",
    agentName: "TechSupport",
    customerName: "Roberto Almeida",
    lastInteractionAt: "2025-04-21T14:50:00Z",
    handledBy: "human",
    messages: [
      {
        id: "msg-017",
        content: "Minha impressora não está funcionando",
        timestamp: "2025-04-21T14:45:00Z",
        sender: "customer",
      },
      {
        id: "msg-018",
        content:
          "Olá Roberto. Vamos tentar resolver isso. Qual é o modelo da sua impressora?",
        timestamp: "2025-04-21T14:47:00Z",
        sender: "agent",
      },
      {
        id: "msg-019",
        content: "É uma HP LaserJet Pro",
        timestamp: "2025-04-21T14:48:00Z",
        sender: "customer",
      },
      {
        id: "msg-020",
        content:
          "Este é um problema comum. Vamos tentar reinicializar. Pode desligar a impressora, aguardar 30 segundos e ligar novamente?",
        timestamp: "2025-04-21T14:50:00Z",
        sender: "agent",
      },
    ],
  },
  {
    id: "conv-006",
    agentId: "agent-003",
    agentName: "SalesBot",
    customerName: "Juliana Costa",
    lastInteractionAt: "2025-04-20T11:35:00Z",
    handledBy: "ai",
    messages: [
      {
        id: "msg-021",
        content: "Olá, estou com uma dúvida sobre a garantia dos produtos",
        timestamp: "2025-04-20T11:30:00Z",
        sender: "customer",
      },
      {
        id: "msg-022",
        content:
          "Olá Juliana! Ficarei feliz em esclarecer suas dúvidas sobre garantias. Todos os nossos produtos têm garantia mínima de 12 meses. Você tem uma pergunta sobre um produto específico?",
        timestamp: "2025-04-20T11:32:00Z",
        sender: "agent",
      },
      {
        id: "msg-023",
        content: "Sim, sobre notebooks",
        timestamp: "2025-04-20T11:34:00Z",
        sender: "customer",
      },
      {
        id: "msg-024",
        content:
          "Nossos notebooks possuem garantia estendida de 24 meses para defeitos de fabricação. Você já adquiriu um de nossos notebooks ou está planejando comprar?",
        timestamp: "2025-04-20T11:35:00Z",
        sender: "agent",
      },
    ],
  },
  {
    id: "conv-007",
    agentId: "agent-004",
    agentName: "CustomerService",
    customerName: "Paulo Fernandes",
    lastInteractionAt: "2025-04-19T13:20:00Z",
    handledBy: "ai",
    messages: [
      {
        id: "msg-025",
        content: "Preciso fazer uma reclamação",
        timestamp: "2025-04-19T13:15:00Z",
        sender: "customer",
      },
      {
        id: "msg-026",
        content:
          "Lamento ouvir isso, Paulo. Estou aqui para ajudar. Pode me contar mais detalhes sobre o problema que está enfrentando?",
        timestamp: "2025-04-19T13:17:00Z",
        sender: "agent",
      },
      {
        id: "msg-027",
        content: "Comprei um produto que veio com defeito",
        timestamp: "2025-04-19T13:19:00Z",
        sender: "customer",
      },
      {
        id: "msg-028",
        content:
          "Sinto muito por isso. Vamos resolver rapidamente. Você poderia me informar o número do pedido e qual produto apresentou defeito?",
        timestamp: "2025-04-19T13:20:00Z",
        sender: "agent",
      },
    ],
  },
  {
    id: "conv-008",
    agentId: "agent-001",
    agentName: "HealthBot",
    customerName: "Fernanda Lima",
    lastInteractionAt: "2025-04-18T09:10:00Z",
    handledBy: "ai",
    messages: [
      {
        id: "msg-029",
        content: "Bom dia, gostaria de saber sobre vacinas",
        timestamp: "2025-04-18T09:05:00Z",
        sender: "customer",
      },
      {
        id: "msg-030",
        content:
          "Bom dia, Fernanda! Posso te ajudar com informações sobre vacinas. Você está buscando informações sobre alguma vacina específica ou o calendário de vacinação?",
        timestamp: "2025-04-18T09:07:00Z",
        sender: "agent",
      },
      {
        id: "msg-031",
        content: "Sobre a vacina da gripe",
        timestamp: "2025-04-18T09:08:00Z",
        sender: "customer",
      },
      {
        id: "msg-032",
        content:
          "A vacina contra gripe é recomendada anualmente, especialmente para grupos de risco como idosos, gestantes e pessoas com doenças crônicas. Nossa clínica está oferecendo a vacina com 15% de desconto este mês. Você gostaria de agendar?",
        timestamp: "2025-04-18T09:10:00Z",
        sender: "agent",
      },
    ],
  },
];

export const addAgent = (agent: Omit<Agent, "id">): Agent => {
  const newAgent: Agent = {
    id: `agent-${AGENTS.length + 1}`,
    ...agent,
  };
  AGENTS.push(newAgent);
  return newAgent;
};

export const updateAgent = (
  id: string,
  updates: Partial<Agent>
): Agent | undefined => {
  const agentIndex = AGENTS.findIndex((agent) => agent.id === id);
  if (agentIndex !== -1) {
    AGENTS[agentIndex] = { ...AGENTS[agentIndex], ...updates };
    return AGENTS[agentIndex];
  }
  return undefined;
};

export const deleteAgent = (id: string): void => {
  const agentIndex = AGENTS.findIndex((agent) => agent.id === id);
  if (agentIndex !== -1) {
    AGENTS.splice(agentIndex, 1);
  }
};

// Function to delete a content
export const deleteContent = (id: string): void => {
  const index = CONTENT.findIndex((content) => content.id === id);
  if (index !== -1) {
    CONTENT.splice(index, 1);
  }
};

export const WHATSAPP_INTEGRATIONS: WhatsAppIntegration[] = [
  {
    id: "whatsapp-001",
    name: "WhatsApp Integration 1",
    agentId: "agent-001",
    phoneNumber: "+5511999999999",
    apiKey: "",
    createdAt: new Date(),
    webhookUrl: "https://example.com/webhook",
    status: "active",
    provider: "twilio",
    instanceApi: "https://api.twilio.com",
  },
];

export const CONTENTS: Content[] = [
  {
    id: "content-001",
    name: "Como fazer um bom café",
    createdAt: new Date(),
    type: "file",
    updatedAt: new Date(),
  },
];
