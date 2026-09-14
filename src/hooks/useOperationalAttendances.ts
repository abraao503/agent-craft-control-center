import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getAttendanceDetail } from "@/services/operation/getAttendanceDetail";
import { getOperationalKanban } from "@/services/operation/getOperationalKanban";
import { listAttendanceMessages } from "@/services/operation/listAttendanceMessages";
import { listAttendanceTimeline } from "@/services/operation/listAttendanceTimeline";
import { listAttendanceCommands } from "@/services/operation/listAttendanceCommands";
import { listAttendanceEvents } from "@/services/operation/listAttendanceEvents";
import { listAttendanceOptions } from "@/services/operation/listAttendanceOptions";
import { listAttendanceSummary } from "@/services/operation/listAttendanceSummary";
import { listAttendances } from "@/services/operation/listAttendances";
import { markAttendanceRead } from "@/services/operation/markAttendanceRead";
import { listOperationalFollowUpOccurrences } from "@/services/operation/listOperationalFollowUpOccurrences";
import { listOperationalFollowUps } from "@/services/operation/listOperationalFollowUps";
import { listOperationalAttendanceTemplates } from "@/services/operation/listOperationalAttendanceTemplates";
import {
  AttendanceSummaryFilters,
  ListAttendanceMessagesParams,
  ListAttendanceTimelineParams,
  ListAttendanceKanbanFilters,
  ListAttendancesFilters,
  OperationalFollowUpOccurrenceStatus,
  OperationalFollowUpStatus,
} from "@/types/operation-attendance";

export function useOperationalAttendances(
  workspaceId?: string,
  filters: ListAttendancesFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation", "attendances", workspaceId, filters],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      return listAttendances({ workspaceId, ...filters });
    },
    enabled: Boolean(workspaceId && enabled),
    placeholderData: (previousData) => previousData,
  });
}

export function useOperationalAttendanceKanban(
  workspaceId?: string,
  filters: ListAttendanceKanbanFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation", "attendance-kanban", workspaceId, filters],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return getOperationalKanban({ workspaceId, ...filters });
    },
    enabled: Boolean(workspaceId && enabled),
    placeholderData: (previousData) => previousData,
  });
}

export function useOperationalAttendanceMessages(
  workspaceId?: string,
  attendanceId?: string,
  options: Pick<
    Omit<ListAttendanceMessagesParams, "workspaceId" | "attendanceId">,
    "limit"
  > = {},
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: [
      "operation",
      "attendance-messages",
      workspaceId,
      attendanceId,
      options.limit ?? 50,
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }
      return listAttendanceMessages({
        workspaceId,
        attendanceId,
        ...options,
        before: pageParam,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: Boolean(workspaceId && attendanceId && enabled),
  });
}

export function useOperationalAttendanceTimeline(
  workspaceId?: string,
  attendanceId?: string,
  options: Pick<
    Omit<ListAttendanceTimelineParams, "workspaceId" | "attendanceId">,
    "limit"
  > = {},
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: [
      "operation",
      "attendance-timeline",
      workspaceId,
      attendanceId,
      options.limit ?? 50,
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }
      return listAttendanceTimeline({
        workspaceId,
        attendanceId,
        ...options,
        before: pageParam,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: Boolean(workspaceId && attendanceId && enabled),
  });
}

export function useMarkOperationalAttendanceRead(
  workspaceId?: string,
  attendanceId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }
      return markAttendanceRead({ workspaceId, attendanceId });
    },
    onSuccess: async () => {
      if (!workspaceId) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["operation", "attendances", workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["operation", "conversations", workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["operation", "attendance-kanban", workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["operation", "attendance-summary", workspaceId],
        }),
        attendanceId
          ? queryClient.invalidateQueries({
              queryKey: ["operation", "attendance", workspaceId, attendanceId],
            })
          : Promise.resolve(),
      ]);
    },
  });
}

export function useOperationalAttendanceSummary(
  workspaceId?: string,
  filters: AttendanceSummaryFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation", "attendance-summary", workspaceId, filters],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listAttendanceSummary({ workspaceId, ...filters });
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalAttendanceOptions(
  workspaceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation", "attendance-options", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }

      return listAttendanceOptions({ workspaceId });
    },
    enabled: Boolean(workspaceId && enabled),
  });
}

export function useOperationalAttendanceDetail(
  workspaceId?: string,
  attendanceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation", "attendance", workspaceId, attendanceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }
      return getAttendanceDetail({ workspaceId, attendanceId });
    },
    enabled: Boolean(workspaceId && attendanceId && enabled),
  });
}

export function useOperationalAttendanceTemplates(
  workspaceId?: string,
  attendanceId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["operation", "attendance-templates", workspaceId, attendanceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }
      return listOperationalAttendanceTemplates({ workspaceId, attendanceId });
    },
    enabled: Boolean(workspaceId && attendanceId && enabled),
  });
}

export function useOperationalAttendanceEvents(
  workspaceId?: string,
  attendanceId?: string,
  options: { page?: number; limit?: number; afterVersion?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "operation",
      "attendance-events",
      workspaceId,
      attendanceId,
      options.page ?? 1,
      options.afterVersion,
    ],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }
      return listAttendanceEvents({
        workspaceId,
        attendanceId,
        ...options,
      });
    },
    enabled: Boolean(workspaceId && attendanceId && enabled),
  });
}

export function useOperationalAttendanceCommands(
  workspaceId?: string,
  attendanceId?: string,
  options: { page?: number; limit?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "operation",
      "attendance-commands",
      workspaceId,
      attendanceId,
      options.page ?? 1,
    ],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }
      return listAttendanceCommands({
        workspaceId,
        attendanceId,
        ...options,
      });
    },
    enabled: Boolean(workspaceId && attendanceId && enabled),
  });
}

export function useOperationalFollowUps(
  workspaceId?: string,
  attendanceId?: string,
  options: {
    page?: number;
    limit?: number;
    status?: OperationalFollowUpStatus;
  } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "operation",
      "attendance-follow-ups",
      workspaceId,
      attendanceId,
      options.page ?? 1,
      options.status,
    ],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }
      return listOperationalFollowUps({
        workspaceId,
        attendanceId,
        ...options,
      });
    },
    enabled: Boolean(workspaceId && attendanceId && enabled),
  });
}

export function useOperationalFollowUpOccurrences(
  workspaceId?: string,
  attendanceId?: string,
  followUpId?: string,
  options: {
    page?: number;
    limit?: number;
    status?: OperationalFollowUpOccurrenceStatus;
  } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "operation",
      "attendance-follow-up-occurrences",
      workspaceId,
      attendanceId,
      followUpId,
      options.page ?? 1,
      options.status,
    ],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace operacional não selecionado");
      }
      if (!attendanceId) {
        throw new Error("ID do atendimento não informado");
      }
      if (!followUpId) {
        throw new Error("ID do follow-up não informado");
      }
      return listOperationalFollowUpOccurrences({
        workspaceId,
        attendanceId,
        followUpId,
        ...options,
      });
    },
    enabled: Boolean(workspaceId && attendanceId && followUpId && enabled),
  });
}
