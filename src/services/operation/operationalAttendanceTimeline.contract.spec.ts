import { listAttendanceTimeline } from '@/services/operation/listAttendanceTimeline';
import type {
  AttendanceTimelinePage,
  ListAttendanceTimelineParams,
} from '@/types/operation-attendance';

const params: ListAttendanceTimelineParams = {
  workspaceId: '00000000-0000-0000-0000-000000000000',
  attendanceId: '11111111-1111-1111-1111-111111111111',
  limit: 50,
};

function operationalAttendanceTimelineHttpContract(
  page: AttendanceTimelinePage,
): Promise<AttendanceTimelinePage> {
  const first = page.items[0];
  if (first?.kind === 'message') {
    void first.content;
  }
  if (first?.kind === 'event') {
    void first.action;
  }

  return listAttendanceTimeline(params);
}

void operationalAttendanceTimelineHttpContract;
