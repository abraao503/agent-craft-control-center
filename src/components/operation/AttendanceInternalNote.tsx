import { LockKeyhole } from "lucide-react";
import type { AttendanceTimelineInternalNoteItem } from "@/types/operation-attendance";

interface AttendanceInternalNoteProps {
  note: AttendanceTimelineInternalNoteItem;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AttendanceInternalNote({ note }: AttendanceInternalNoteProps) {
  const author = note.authorUserId
    ? `Autor: ${note.authorUserId}`
    : "Autor: equipe interna";

  return (
    <article
      aria-label={`Nota interna · ${author} · ${formatDateTime(note.createdAt)}`}
      className="mx-auto max-w-[min(90%,42rem)] rounded-xl border border-fuchsia-200 bg-fuchsia-50/80 px-4 py-3 text-sm text-fuchsia-950 shadow-sm dark:border-fuchsia-900 dark:bg-fuchsia-950/20 dark:text-fuchsia-100"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
        <LockKeyhole className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Nota interna</span>
        <span aria-hidden="true">·</span>
        <span>Somente a equipe</span>
      </div>
      <p className="whitespace-pre-wrap break-words">{note.content}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs opacity-80">
        <span>{author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={note.createdAt}>{formatDateTime(note.createdAt)}</time>
      </div>
    </article>
  );
}
