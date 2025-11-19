import { api } from '../api';
import { AssignUserToDealInput } from '@/types/user';

export async function assignUserToDeal(
  dealId: string,
  input: AssignUserToDealInput
): Promise<void> {
  await api.patch(`/deal/${dealId}/assign-user`, 
    { userId: input.userId },
    {
      params: {
        workspaceId: input.workspaceId,
      },
    }
  );
}
