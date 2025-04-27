import { Agent, AgentStatus } from "@/types/agent";
import { Content } from "@/types/content";
import { WhatsAppIntegration } from "@/types/whatsapp";
import { UploadDocumentResponse } from "@/types/file";
import { Conversation } from "@/types/conversation";

export const AGENT_STATUSES = [
  {
    label: "Ativo",
    value: AgentStatus.ACTIVE,
  },
  {
    label: "Inativo",
    value: AgentStatus.INACTIVE,
  },
];

export const IA_MODELS = [
  {
    id: "ia-model-1",
    name: "GPT-3",
  },
  {
    id: "ia-model-2",
    name: "GPT-4",
  },
];

export const AI_MODELS = IA_MODELS;

export const LANGUAGES = [
  { code: "en-US", name: "English (US)" },
  { code: "es-ES", name: "Spanish (ES)" },
  { code: "pt-BR", name: "Portuguese (BR)" },
];

export const TIME_ZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Sao_Paulo", label: "Brasilia Time (BRT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
];

export const AGENTS: Agent[] = [
  {
    id: "agent-001",
    name: "HealthBot",
    status: AgentStatus.ACTIVE,
    language: "pt-BR",
    iaModel: IA_MODELS[0],
    iaModelId: "ia-model-1",
    iaModelName: "GPT-3",
    avatar: null,
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
    internalName: "health-bot",
    description: "A bot for healthcare information",
    timeZone: "America/New_York",
    initialMessage: "Hello! How can I assist with your health questions?",
    prompt: {
      description: "Healthcare assistant",
      goal: "Provide health information",
      habilities: "Medical knowledge, empathy",
      companyName: "HealthCo",
      companySite: "https://healthco.example",
      companyDescription: "Healthcare provider",
      companySector: "Healthcare",
    },
    contentsIds: [],
    customFields: [],
    uploadDocuments: [],
  },
  {
    id: "agent-002",
    name: "TechSupport",
    status: AgentStatus.INACTIVE,
    language: "en-US",
    iaModel: IA_MODELS[1],
    iaModelId: "ia-model-2",
    iaModelName: "GPT-4",
    avatar: null,
    createdAt: new Date("2023-02-20"),
    updatedAt: new Date("2023-02-20"),
    internalName: "tech-support",
    description: "Technical support assistant",
    timeZone: "America/Los_Angeles",
    initialMessage: "Need tech help? I'm here!",
    prompt: {
      description: "Tech support assistant",
      goal: "Solve technical problems",
      habilities: "Troubleshooting, patience",
      companyName: "TechCo",
      companySite: "https://techco.example",
      companyDescription: "Tech company",
      companySector: "Technology",
    },
    contentsIds: [],
    customFields: [],
    uploadDocuments: [],
  },
  {
    id: "agent-003",
    name: "SalesBot",
    status: AgentStatus.ACTIVE,
    language: "es-ES",
    iaModel: IA_MODELS[0],
    iaModelId: "ia-model-1",
    iaModelName: "GPT-3",
    avatar: null,
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2023-03-10"),
    internalName: "sales-bot",
    description: "Sales assistant",
    timeZone: "Europe/London",
    initialMessage: "¡Hola! ¿Cómo puedo ayudarte hoy?",
    prompt: {
      description: "Sales assistant",
      goal: "Increase sales",
      habilities: "Persuasion, product knowledge",
      companyName: "SalesCo",
      companySite: "https://salesco.example",
      companyDescription: "Sales company",
      companySector: "Sales",
    },
    contentsIds: [],
    customFields: [],
    uploadDocuments: [],
  },
  {
    id: "agent-004",
    name: "CustomerService",
    status: AgentStatus.ACTIVE,
    language: "pt-BR",
    iaModel: IA_MODELS[0],
    iaModelId: "ia-model-1",
    iaModelName: "GPT-3",
    avatar: null,
    createdAt: new Date("2023-04-05"),
    updatedAt: new Date("2023-04-05"),
    internalName: "customer-service",
    description: "Customer support assistant",
    timeZone: "America/Sao_Paulo",
    initialMessage: "Olá! Como posso ajudar você hoje?",
    prompt: {
      description: "Customer service assistant",
      goal: "Provide excellent support",
      habilities: "Empathy, communication",
      companyName: "ServiceCo",
      companySite: "https://serviceco.example",
      companyDescription: "Service company",
      companySector: "Customer Service",
    },
    contentsIds: [],
    customFields: [],
    uploadDocuments: [],
  },
];

export const CONTENT = [
  {
    id: "content-001",
    name: "Brewing Coffee Guide",
    type: "file",
    content: "To make a good coffee, you need hot water, quality coffee, and a filter.",
    createdAt: new Date("2023-01-10"),
    updatedAt: new Date("2023-01-10"),
  },
  {
    id: "content-002",
    name: "Chocolate Cake Recipe",
    type: "file",
    content: "To make a chocolate cake, you need flour, sugar, cocoa powder, eggs, milk, and baking powder.",
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
  },
];

export const CONTENTS = CONTENT;

export const WHATSAPP_INTEGRATIONS: WhatsAppIntegration[] = [
  {
    id: "whatsapp-1",
    name: "Company WhatsApp",
    phoneNumber: "+5511999999999",
    agentId: "agent-001",
    apiKey: "api-key-1",
    createdAt: new Date("2023-01-15"),
    webhookUrl: "https://example.com/webhook/1",
    status: "active",
    instanceApi: "instance-1",
    token: "token-1",
  },
  {
    id: "whatsapp-2",
    name: "Customer Support",
    phoneNumber: "+5511999999998",
    agentId: "agent-002",
    apiKey: "api-key-2",
    createdAt: new Date("2023-02-20"),
    webhookUrl: "https://example.com/webhook/2",
    status: "active",
    instanceApi: "instance-2",
    token: "token-2",
  },
];

export const FILES: UploadDocumentResponse[] = [
  {
    id: "file-1",
    name: "Product Manual.pdf",
  },
  {
    id: "file-2",
    name: "Terms of Use.pdf",
  },
];

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
        sender: "agent"
      },
      {
        id: "msg-002",
        content: "Preciso marcar uma consulta para amanhã",
        timestamp: "2025-04-25T14:29:00Z",
        sender: "customer"
      },
      {
        id: "msg-003",
        content: "Claro! Temos horários disponíveis às 10h e 15h. Qual prefere?",
        timestamp: "2025-04-25T14:30:00Z",
        sender: "agent"
      }
    ]
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
        sender: "agent"
      },
      {
        id: "msg-005",
        content: "Meu laptop não está ligando",
        timestamp: "2025-04-24T09:42:00Z",
        sender: "customer"
      },
      {
        id: "msg-006",
        content: "Entendi. Você tentou carregar a bateria por pelo menos 30 minutos?",
        timestamp: "2025-04-24T09:43:00Z",
        sender: "agent"
      },
      {
        id: "msg-007",
        content: "Sim, mas não funcionou",
        timestamp: "2025-04-24T09:44:00Z",
        sender: "customer"
      },
      {
        id: "msg-008",
        content: "Este caso parece mais complexo. Um técnico humano assumirá o atendimento agora.",
        timestamp: "2025-04-24T09:45:00Z",
        sender: "agent"
      }
    ]
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
        sender: "customer"
      },
      {
        id: "msg-010",
        content: "Olá Carlos! Claro, temos vários produtos que podem te interessar. Você procura algo específico?",
        timestamp: "2025-04-23T16:17:00Z",
        sender: "agent"
      },
      {
        id: "msg-011",
        content: "Estou procurando um smartphone novo",
        timestamp: "2025-04-23T16:19:00Z",
        sender: "customer"
      },
      {
        id: "msg-012",
        content: "Ótimo! Temos os modelos X2000, Y3000 e Z5000 disponíveis. Qual faixa de preço você está considerando?",
        timestamp: "2025-04-23T16:20:00Z",
        sender: "agent"
      }
    ]
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
        sender: "customer"
      },
      {
        id: "msg-014",
        content: "Bom dia, Ana! Claro, posso te ajudar com informações sobre exames de sangue. O que exatamente você gostaria de saber?",
        timestamp: "2025-04-22T10:02:00Z",
        sender: "agent"
      },
      {
        id: "msg-015",
        content: "Preciso saber se preciso estar em jejum",
        timestamp: "2025-04-22T10:04:00Z",
        sender: "customer"
      },
      {
        id: "msg-016",
        content: "Para a maioria dos exames de sangue, sim, é recomendado jejum de 8-12 horas. Quais exames específicos você fará?",
        timestamp: "2025-04-22T10:05:00Z",
        sender: "agent"
      }
    ]
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
        sender: "customer"
      },
      {
        id: "msg-018",
        content: "Olá Roberto. Vamos tentar resolver isso. Qual é o modelo da sua impressora?",
        timestamp: "2025-04-21T14:47:00Z",
        sender: "agent"
      },
      {
        id: "msg-019",
        content: "É uma HP LaserJet Pro",
        timestamp: "2025-04-21T14:48:00Z",
        sender: "customer"
      },
      {
        id: "msg-020",
        content: "Este é um problema comum. Vamos tentar reinicializar. Pode desligar a impressora, aguardar 30 segundos e ligar novamente?",
        timestamp: "2025-04-21T14:50:00Z",
        sender: "agent"
      }
    ]
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
        sender: "customer"
      },
      {
        id: "msg-022",
        content: "Olá Juliana! Ficarei feliz em esclarecer suas dúvidas sobre garantias. Todos os nossos produtos têm garantia mínima de 12 meses. Você tem uma pergunta sobre um produto específico?",
        timestamp: "2025-04-20T11:32:00Z",
        sender: "agent"
      },
      {
        id: "msg-023",
        content: "Sim, sobre notebooks",
        timestamp: "2025-04-20T11:34:00Z",
        sender: "customer"
      },
      {
        id: "msg-024",
        content: "Nossos notebooks possuem garantia estendida de 24 meses para defeitos de fabricação. Você já adquiriu um de nossos notebooks ou está planejando comprar?",
        timestamp: "2025-04-20T11:35:00Z",
        sender: "agent"
      }
    ]
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
        sender: "customer"
      },
      {
        id: "msg-026",
        content: "Lamento ouvir isso, Paulo. Estou aqui para ajudar. Pode me contar mais detalhes sobre o problema que está enfrentando?",
        timestamp: "2025-04-19T13:17:00Z",
        sender: "agent"
      },
      {
        id: "msg-027",
        content: "Comprei um produto que veio com defeito",
        timestamp: "2025-04-19T13:19:00Z",
        sender: "customer"
      },
      {
        id: "msg-028",
        content: "Sinto muito por isso. Vamos resolver rapidamente. Você poderia me informar o número do pedido e qual produto apresentou defeito?",
        timestamp: "2025-04-19T13:20:00Z",
        sender: "agent"
      }
    ]
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
        sender: "customer"
      },
      {
        id: "msg-030",
        content: "Bom dia, Fernanda! Posso te ajudar com informações sobre vacinas. Você está buscando informações sobre alguma vacina específica ou o calendário de vacinação?",
        timestamp: "2025-04-18T09:07:00Z",
        sender: "agent"
      },
      {
        id: "msg-031",
        content: "Sobre a vacina da gripe",
        timestamp: "2025-04-18T09:08:00Z",
        sender: "customer"
      },
      {
        id: "msg-032",
        content: "A vacina contra gripe é recomendada anualmente, especialmente para grupos de risco como idosos, gestantes e pessoas com doenças crônicas. Nossa clínica está oferecendo a vacina com 15% de desconto este mês. Você gostaria de agendar?",
        timestamp: "2025-04-18T09:10:00Z",
        sender: "agent"
      }
    ]
  }
];

export const addAgent = (agent: Omit<Agent, "id">): Agent => {
  const newAgent: Agent = {
    id: `agent-${AGENTS.length + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...agent,
  };
  AGENTS.push(newAgent);
  return newAgent;
};

export const updateAgent = (id: string, updates: Partial<Agent>): Agent | undefined => {
  const agentIndex = AGENTS.findIndex((agent) => agent.id === id);
  if (agentIndex !== -1) {
    AGENTS[agentIndex] = { ...AGENTS[agentIndex], ...updates, updatedAt: new Date() };
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

export const addContent = (content: Omit<Content, "id">): Content => {
  const newContent: Content = {
    id: `content-${CONTENT.length + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...content,
  };
  CONTENT.push(newContent);
  return newContent;
};

export const updateContent = (id: string, updates: Partial<Content>): Content | undefined => {
  const contentIndex = CONTENT.findIndex((content) => content.id === id);
  if (contentIndex !== -1) {
    CONTENT[contentIndex] = { ...CONTENT[contentIndex], ...updates, updatedAt: new Date() };
    return CONTENT[contentIndex];
  }
  return undefined;
};

export const addWhatsAppIntegration = (
  integration: Omit<WhatsAppIntegration, "id">
): WhatsAppIntegration => {
  const newIntegration: WhatsAppIntegration = {
    id: `whatsapp-${WHATSAPP_INTEGRATIONS.length + 1}`,
    ...integration,
  };
  WHATSAPP_INTEGRATIONS.push(newIntegration);
  return newIntegration;
};

export const deleteWhatsAppIntegration = (id: string): void => {
  const index = WHATSAPP_INTEGRATIONS.findIndex((integration) => integration.id === id);
  if (index !== -1) {
    WHATSAPP_INTEGRATIONS.splice(index, 1);
  }
};

export const deleteContent = (id: string): void => {
  const index = CONTENT.findIndex((content) => content.id === id);
  if (index !== -1) {
    CONTENT.splice(index, 1);
  }
};
