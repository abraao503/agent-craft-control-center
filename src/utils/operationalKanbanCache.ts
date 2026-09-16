import {
  AttendanceKanbanPage,
  AttendanceStatus,
  AttendanceWithDetails,
} from "@/types/operation-attendance";

export function moveAttendanceInKanban(
  data: AttendanceKanbanPage,
  attendance: AttendanceWithDetails,
  targetStatus: AttendanceStatus,
  updates: Partial<AttendanceWithDetails>,
): AttendanceKanbanPage {
  const sourceColumn = data.columns.find((column) =>
    column.items.some((item) => item.id === attendance.id),
  );
  if (!sourceColumn) return data;

  const nextAttendance: AttendanceWithDetails = {
    ...attendance,
    ...updates,
    status: targetStatus,
  };
  if (sourceColumn.status === targetStatus) {
    return replaceAttendanceInKanban(data, nextAttendance);
  }

  return {
    ...data,
    columns: data.columns.map((column) => {
      if (column.status === sourceColumn.status) {
        return updateColumnTotals(
          {
            ...column,
            items: column.items.filter((item) => item.id !== attendance.id),
          },
          -1,
        );
      }
      if (column.status === targetStatus) {
        return updateColumnTotals(
          {
            ...column,
            items: [
              nextAttendance,
              ...column.items.filter((item) => item.id !== attendance.id),
            ],
          },
          1,
        );
      }
      return column;
    }),
  };
}

export function replaceAttendanceInKanban(
  data: AttendanceKanbanPage,
  attendance: AttendanceWithDetails,
): AttendanceKanbanPage {
  const currentColumn = data.columns.find((column) =>
    column.items.some((item) => item.id === attendance.id),
  );
  if (!currentColumn) return data;
  if (currentColumn.status === attendance.status) {
    return {
      ...data,
      columns: data.columns.map((column) =>
        column.status === currentColumn.status
          ? {
              ...column,
              items: column.items.map((item) =>
                item.id === attendance.id ? attendance : item,
              ),
            }
          : column,
      ),
    };
  }

  const existing = currentColumn.items.find(
    (item) => item.id === attendance.id,
  );
  if (!existing) return data;

  return moveAttendanceInKanban(data, existing, attendance.status, attendance);
}

export function updateColumnTotals(
  column: AttendanceKanbanPage["columns"][number],
  delta: number,
) {
  const total = Math.max(0, column.total + delta);
  return {
    ...column,
    total,
    totalPages:
      total > 0 && column.limit > 0 ? Math.ceil(total / column.limit) : 0,
  };
}
