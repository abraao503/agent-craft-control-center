import { getOperationalKanban } from "@/services/operation/getOperationalKanban";
import type {
  AttendanceKanbanPage,
  AttendanceWithDetails,
  ListAttendanceKanbanParams,
} from "@/types/operation-attendance";

const workspaceId = "00000000-0000-0000-0000-000000000000";

async function operationalAttendanceKanbanHttpContract(): Promise<void> {
  const params: ListAttendanceKanbanParams = {
    workspaceId,
    page: 1,
    limit: 20,
    closedLimit: 10,
  };
  const result: AttendanceKanbanPage = await getOperationalKanban(params);
  const column: AttendanceKanbanPage["columns"][number] = result.columns[0];
  const card: AttendanceWithDetails | undefined = column.items[0];

  void card;
}

void operationalAttendanceKanbanHttpContract;
