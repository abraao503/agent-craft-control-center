export type CustomerImportStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface CustomerImport {
  id: string;
  fileName: string;
  status: CustomerImportStatus;
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface CustomerImportDetail {
  id: string;
  fileName: string;
  status: CustomerImportStatus;
  totalRows: number;
  successCount: number;
  errorCount: number;
  processedCount: number;
  hasErrors: boolean;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdBy: {
    id: string;
    name: string;
  };
  workspace: {
    id: string;
    name: string;
  };
}

export interface CustomerImportUploadResponse {
  importId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface ListCustomerImportsParams {
  workspaceId: string;
  page?: number;
  limit?: number;
}

export interface CustomerImportListResponse {
  items: CustomerImport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
