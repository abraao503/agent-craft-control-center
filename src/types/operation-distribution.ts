export type OperationalDistributionStrategy = "UNIFORM";

export interface OperationalDistributionSettings {
  enabled: boolean;
  strategy: OperationalDistributionStrategy;
  excludedChannelIds: string[];
  excludedAreaIds: string[];
  excludedQueueIds: string[];
  excludedUserIds: string[];
  version: number;
  updatedAt: string;
}

export interface OperationalDistributionOption {
  id: string;
  name: string;
}

export interface OperationalDistributionQueueOption
  extends OperationalDistributionOption {
  areaId: string;
}

export interface OperationalDistributionOptions {
  channels: OperationalDistributionOption[];
  areas: OperationalDistributionOption[];
  queues: OperationalDistributionQueueOption[];
  users: OperationalDistributionOption[];
}

export interface UpdateOperationalDistributionBody {
  enabled: boolean;
  strategy: OperationalDistributionStrategy;
  excludedChannelIds: string[];
  excludedAreaIds: string[];
  excludedQueueIds: string[];
  excludedUserIds: string[];
  expectedVersion: number;
}

export interface UpdateOperationalDistributionParams {
  workspaceId: string;
  body: UpdateOperationalDistributionBody;
}
