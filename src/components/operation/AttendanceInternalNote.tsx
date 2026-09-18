import { LockKeyhole } from "lucide-react";
import type { AttendanceTimelineInternalNoteItem } from "@/types/operation-attendance";

interface AttendanceInternalNoteProps {
  note: AttendanceTimelineInternalNoteItem;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AttendanceInternalNote({ note }: AttendanceInternalNoteProps) {
  const authorName = note.authorName?.trim() || "Equipe interna";

  return (
    <article
      aria-label={`Nota da equipe, adicionada por ${authorName}, ${formatDateTime(note.createdAt)}`}
      className="mx-auto w-full max-w-2xl rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground shadow-sm dark:border-primary/40 dark:bg-primary/10"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <LockKeyhole className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Nota da equipe</span>
        </div>
        <span className="rounded-full bg-background/70 px-2 py-0.5 text-muted-foreground">
          Visível só para a equipe
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words">{note.content}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>Adicionada por {authorName}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={note.createdAt}>{formatDateTime(note.createdAt)}</time>
      </div>
    </article>
  );
}
