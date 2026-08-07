// Shared types for WhatsApp integrations
// Centralized definition to avoid duplication across the codebase

export type WhatsAppIntegrationName = 'z-api' | 'evolux' | 'meta-cloud';

export type WhatsAppProviderCapabilities = {
  connectionMode: 'credentials' | 'provisioned-number';
  supportsTemplates: boolean;
  supportsStatuses: boolean;
  supports24HourWindow: boolean;
  supportsMedia: boolean;
};

export const WHATSAPP_INTEGRATION_NAMES = {
  ZAPI: 'z-api' as const,
  EVOLUX: 'evolux' as const,
  META_CLOUD: 'meta-cloud' as const,
} as const;
