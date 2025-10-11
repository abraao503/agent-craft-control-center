// Types for Stage Form Fields
// Comments in English as per project rules

export type FieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "datetime"
  | "date"
  | "phone"
  | "email"
  | "cpf"
  | "cnpj";

export type DocumentType = "cpf" | "cnpj";

export interface StageFormField {
  id: string;
  name: string;
  label: string;
  description?: string | null;
  type: FieldType;
  isRequired: boolean;
  order: number;
  stageId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  value?: string | null; // Field value when loaded with deal data
}

export interface CreateStageFormFieldInput {
  name: string;
  label: string;
  description?: string;
  type: FieldType;
  isRequired: boolean;
  order: number;
  stageId: string;
}

export interface UpdateStageFormFieldInput {
  label?: string;
  description?: string;
  isRequired?: boolean;
  order?: number;
}

export interface StageFormFieldHistory {
  stageId: string;
  stageName: string;
  stageOrder: number;
  fields: StageFormField[];
}

export interface SaveFormFieldValuesInput {
  values: {
    fieldId: string;
    value: string;
  }[];
}
