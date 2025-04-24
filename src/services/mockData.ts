import { Agent, AIModel, CustomField, Language, TimeZone } from "@/types/agent";
import { Content } from "@/types/content";
import { WhatsAppIntegration } from "@/types/whatsapp";

// Mock Data
export const AI_MODELS: AIModel[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic" },
];

export const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
];

export const TIME_ZONES: TimeZone[] = [
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo" },
];

export let AGENTS: Agent[] = [
  {
    id: "agent-1",
    name: "Customer Support",
    internalName: "customer-support-agent",
    description: "A helpful agent that assists customers with their inquiries.",
    avatarUrl: "/avatars/agent1.png",
    timeZone: "America/New_York",
    language: "en",
    initialMessage: "Hello! How can I assist you today?",
    iaModelId: "gpt-4o",
    prompt: {
      description: "A helpful customer support agent that assists users with product inquiries.",
      goal: "Help users find the right product for their needs and resolve any issues.",
      habilities: "Product knowledge, troubleshooting, empathy, clear communication.",
      companyName: "Acme Inc.",
      companySite: "https://www.example.com",
      companyDescription: "Acme Inc. is a leading provider of innovative solutions for...",
      companySector: "Technology",
    },
    contentsIds: ["content-1", "content-2"],
    customFields: [],
    createdAt: new Date("2024-01-20T12:00:00.000Z"),
    updatedAt: new Date("2024-01-20T12:00:00.000Z"),
  },
  {
    id: "agent-2",
    name: "Sales Assistant",
    internalName: "sales-assistant-agent",
    description: "An agent that helps users discover and purchase products.",
    avatarUrl: "/avatars/agent2.png",
    timeZone: "America/Los_Angeles",
    language: "en",
    initialMessage: "Hi there! Looking for something special today?",
    iaModelId: "gemini-1.5-pro",
    prompt: {
      description: "A sales assistant agent that helps users discover and purchase products.",
      goal: "Guide users through the product catalog and assist them in making a purchase.",
      habilities: "Product knowledge, sales techniques, persuasion, clear communication.",
      companyName: "Acme Inc.",
      companySite: "https://www.example.com",
      companyDescription: "Acme Inc. is a leading provider of innovative solutions for...",
      companySector: "Technology",
    },
    contentsIds: ["content-3"],
    customFields: [
      { name: "email", label: "Email Address", type: "text", required: true },
      { name: "phone", label: "Phone Number", type: "number", required: false },
    ],
    createdAt: new Date("2024-05-15T10:00:00.000Z"),
    updatedAt: new Date("2024-05-15T10:00:00.000Z"),
  },
];

export const CONTENTS: Content[] = [
  {
    id: "content-1",
    name: "Product Catalog",
    fileId: "product-catalog.pdf",
    fileType: "pdf",
    uploadedAt: new Date("2024-01-10T08:00:00.000Z"),
  },
  {
    id: "content-2",
    name: "Troubleshooting Guide",
    fileId: "troubleshooting-guide.txt",
    fileType: "txt",
    uploadedAt: new Date("2024-01-15T14:00:00.000Z"),
  },
  {
    id: "content-3",
    name: "Sales Playbook",
    fileId: "sales-playbook.pdf",
    fileType: "pdf",
    uploadedAt: new Date("2024-05-10T09:00:00.000Z"),
  },
];

export const WHATSAPP_INTEGRATIONS: WhatsAppIntegration[] = [
  {
    id: "whatsapp-1",
    agentId: "agent-1",
    phoneNumber: "+15551234567",
    apiKey: "abcdef123456",
    createdAt: new Date("2024-02-01T10:00:00.000Z"),
  },
];

// Mock API Functions
export const addAgent = (data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Agent => {
  const newAgent: Agent = {
    id: `agent-${AGENTS.length + 1}`,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  AGENTS.push(newAgent);
  return newAgent;
};

export const updateAgent = (id: string, data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Agent => {
  const index = AGENTS.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Agent not found');

  const updatedAgent: Agent = {
    ...data,
    id,
    createdAt: AGENTS[index].createdAt,
    updatedAt: new Date(),
  };

  AGENTS[index] = updatedAgent;
  return updatedAgent;
};

export const deleteAgent = (id: string): void => {
  AGENTS = AGENTS.filter(agent => agent.id !== id);
  // Also delete any associated WhatsApp integrations
  WHATSAPP_INTEGRATIONS.filter(integration => integration.agentId !== id).forEach(integration => {
    deleteWhatsAppIntegration(integration.id);
  });
};

export const addContent = (name: string, fileId: string, fileType: "pdf" | "txt"): Content => {
  const newContent: Content = {
    id: `content-${CONTENTS.length + 1}`,
    name,
    fileId,
    fileType,
    uploadedAt: new Date(),
  };
  CONTENTS.push(newContent);
  return newContent;
};

export const deleteWhatsAppIntegration = (id: string): void => {
  WHATSAPP_INTEGRATIONS.filter(integration => integration.id !== id);
};
