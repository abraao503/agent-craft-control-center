// Shared types for WhatsApp integrations
// Centralized definition to avoid duplication across the codebase

export type WhatsAppIntegrationName = 'z-api' | 'evolux';

export const WHATSAPP_INTEGRATION_NAMES = {
  ZAPI: 'z-api' as const,
  EVOLUX: 'evolux' as const,
} as const;
