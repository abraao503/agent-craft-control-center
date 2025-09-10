// Types for Sales Pipeline and Deals
// Comments in English as per project rules

export interface PipelineListItem {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  stagesCount: number;
}

export interface CreatePipelineStageInput {
  name: string;
  description?: string;
  order: number; // integer >= 0
  color: string; // hex color string e.g. #FF0000
  winProbability: number; // 0-100
  isWonStage: boolean;
  isLostStage: boolean;
}

export interface CreatePipelineInput {
  workspaceId: string; // UUID
  name: string;
  description?: string;
  stages: CreatePipelineStageInput[]; // at least 1
}

export interface CreatePipelineResponse {
  id: string;
}

export interface PipelineStageMinimal {
  id: string;
  name: string;
  // Optional fields if backend provides more data
  color?: string;
  winProbability?: number;
}
