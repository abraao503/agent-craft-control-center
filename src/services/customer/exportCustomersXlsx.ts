import { api } from "../api";
import { z } from "zod";

export const filterCustomersDtoSchema = z.object({
  workspaceId: z.string().uuid(),
  messageCount: z.coerce.number().optional(),
  lastInteractionStartDate: z.coerce.date().optional(),
  lastInteractionEndDate: z.coerce.date().optional(),
  lastInteractionType: z
    .enum(["customer", "assistant", "human_assistant"])
    .optional(),
  keywords: z.array(z.string()).optional(),
  timezone: z.string(),
});

export type FilterCustomersDto = z.infer<typeof filterCustomersDtoSchema>;

export const exportCustomersXlsx = async (
  filters: FilterCustomersDto
): Promise<Blob> => {
  const response = await api.get('/customer/export-xlsx', {
    params: filters,
    responseType: 'blob',
  });
  
  return response.data;
};
