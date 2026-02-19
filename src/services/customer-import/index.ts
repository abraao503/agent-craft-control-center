import { api } from "../api";
import {
  CustomerImportUploadResponse,
  CustomerImportListResponse,
  CustomerImportDetail,
  ListCustomerImportsParams,
} from "@/types/customer-import";

/**
 * Upload de planilha XLSX para importação de customers
 */
export const uploadCustomerImport = async (
  file: File,
  workspaceId: string,
): Promise<CustomerImportUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("workspaceId", workspaceId);

  const { data } = await api.post<CustomerImportUploadResponse>(
    "/customer-import/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return data;
};

/**
 * Lista importações de customers com paginação
 */
export const listCustomerImports = async (
  params: ListCustomerImportsParams,
): Promise<CustomerImportListResponse> => {
  const { data } = await api.get<CustomerImportListResponse>(
    "/customer-import",
    { params },
  );
  return data;
};

/**
 * Obtém detalhes de uma importação específica
 */
export const getCustomerImportDetail = async (
  id: string,
): Promise<CustomerImportDetail> => {
  const { data } = await api.get<CustomerImportDetail>(
    `/customer-import/${id}`,
  );
  return data;
};

/**
 * Download do template de importação (.xlsx)
 */
export const downloadImportTemplate = async (): Promise<Blob> => {
  const response = await api.get("/customer-import/download-template", {
    responseType: "blob",
  });
  return response.data;
};

/**
 * Download da planilha de erros de uma importação (.xlsx)
 */
export const downloadImportErrors = async (id: string): Promise<Blob> => {
  const response = await api.get(`/customer-import/${id}/errors`, {
    responseType: "blob",
  });
  return response.data;
};
