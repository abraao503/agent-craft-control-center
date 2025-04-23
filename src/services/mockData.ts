import { Agent } from '@/types/agent';
import { WhatsAppIntegration } from '@/types/whatsapp';

// Sample AI models
export const AI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { id: 'llama-3', name: 'LLaMA 3', provider: 'Meta' },
];

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

// Time zones
export const TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
];

// Sample agents for demonstration
export let AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Customer Support Bot',
    internalName: 'support-bot',
    description: 'Handles customer inquiries and support issues',
    avatarUrl: '/placeholder.svg',
    timeZone: 'America/New_York',
    language: 'en',
    initialMessage: 'Hello! How can I help you today?',
    iaModelId: 'gpt-4o',
    prompt: {
      description: 'A helpful and friendly customer support agent',
      goal: 'Resolve customer issues efficiently and build customer satisfaction',
      habilities: 'Troubleshooting, product knowledge, empathy',
      companyName: 'TechCorp Inc',
      companySite: 'https://example.com',
      companyDescription: 'A leading provider of tech solutions',
      companySector: 'Technology',
    },
    contentsIds: ['faq-1', 'product-manual'],
    customFields: [
      {
        name: 'email',
        label: 'Email Address',
        type: 'text',
        required: true,
      },
      {
        name: 'orderNumber',
        label: 'Order Number',
        type: 'text',
        required: false,
      },
    ],
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-05-20'),
  },
  {
    id: '2',
    name: 'Sales Assistant',
    internalName: 'sales-bot',
    description: 'Helps qualify leads and answer sales questions',
    avatarUrl: '/placeholder.svg',
    timeZone: 'America/Chicago',
    language: 'en',
    initialMessage: 'Hi there! Interested in our products?',
    iaModelId: 'claude-3-sonnet',
    prompt: {
      description: 'A knowledgeable sales assistant',
      goal: 'Qualify leads and convert prospects',
      habilities: 'Product knowledge, persuasion, lead qualification',
      companyName: 'TechCorp Inc',
      companySite: 'https://example.com',
      companyDescription: 'A leading provider of tech solutions',
      companySector: 'Technology',
    },
    contentsIds: ['pricing', 'product-catalog'],
    customFields: [
      {
        name: 'companySize',
        label: 'Company Size',
        type: 'number',
        required: false,
      },
      {
        name: 'budget',
        label: 'Budget Range',
        type: 'text',
        required: true,
      },
    ],
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-06-15'),
  },
];

// Sample WhatsApp integrations
export let WHATSAPP_INTEGRATIONS: WhatsAppIntegration[] = [
  {
    id: '1',
    name: 'Support WhatsApp',
    provider: 'twilio',
    phoneNumber: '+1234567890',
    status: 'active',
    agentId: '1',
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-03-05'),
  },
  {
    id: '2',
    name: 'Z-API Integration',
    provider: 'zapi',
    phoneNumber: '+55987654321',
    status: 'active',
    agentId: '2',
    instanceApi: 'https://api.z-api.io/instances/xyz123',
    token: 'secret-token-123',
    webhookUrl: 'https://yourdomain.com/api/whatsapp/webhook/abc123',
    createdAt: new Date('2023-07-10'),
    updatedAt: new Date('2023-07-10'),
  }
];

// Mock content data
export let CONTENTS: Content[] = [
  {
    id: 'c1',
    name: 'Product Manual',
    fileId: 'file-manual.pdf',
    fileType: 'pdf',
    uploadedAt: new Date('2024-01-15'),
  },
  {
    id: 'c2',
    name: 'FAQ Document',
    fileId: 'file-faq.txt',
    fileType: 'txt',
    uploadedAt: new Date('2024-02-20'),
  },
];

export const addContent = (name: string, fileId: string, fileType: 'pdf' | 'txt') => {
  const newContent = {
    id: Math.random().toString(36).substring(2, 9),
    name,
    fileId,
    fileType,
    uploadedAt: new Date(),
  };
  
  CONTENTS.push(newContent);
  return newContent;
};

export const deleteContent = (id: string) => {
  CONTENTS = CONTENTS.filter(content => content.id !== id);
  return true;
};

export const addAgent = (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newAgent: Agent = {
    ...agent,
    id: Math.random().toString(36).substring(2, 9),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  AGENTS.push(newAgent);
  return newAgent;
};

export const updateAgent = (id: string, updates: Partial<Agent>) => {
  AGENTS = AGENTS.map(agent => 
    agent.id === id 
      ? { ...agent, ...updates, updatedAt: new Date() } 
      : agent
  );
  
  return AGENTS.find(agent => agent.id === id);
};

export const deleteAgent = (id: string) => {
  AGENTS = AGENTS.filter(agent => agent.id !== id);
  return true;
};

export const addWhatsAppIntegration = (integration: Omit<WhatsAppIntegration, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  const newIntegration: WhatsAppIntegration = {
    ...integration,
    id: Math.random().toString(36).substring(2, 9),
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  WHATSAPP_INTEGRATIONS.push(newIntegration);
  return newIntegration;
};

export const updateWhatsAppIntegration = (id: string, updates: Partial<WhatsAppIntegration>) => {
  WHATSAPP_INTEGRATIONS = WHATSAPP_INTEGRATIONS.map(integration => 
    integration.id === id 
      ? { ...integration, ...updates, updatedAt: new Date() } 
      : integration
  );
  
  return WHATSAPP_INTEGRATIONS.find(integration => integration.id === id);
};

export const deleteWhatsAppIntegration = (id: string) => {
  WHATSAPP_INTEGRATIONS = WHATSAPP_INTEGRATIONS.filter(integration => integration.id !== id);
  return true;
};
