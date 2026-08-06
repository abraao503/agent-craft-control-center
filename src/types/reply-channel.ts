export type ReplyChannel = {
  integrationId: string;
  pipeline: { id: string; name: string };
  provider: string;
  active: boolean;
  status: string;
  connectionStatus: string;
  metaDisplayPhoneNumber: string | null;
  available: boolean;
};

export type ReplyChannelsResponse = {
  channels: ReplyChannel[];
  latestInbound: {
    messageId: string;
    integrationId: string | null;
  } | null;
  suggestedIntegrationId: string | null;
};
