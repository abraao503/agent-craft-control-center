import { useLayoutEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRetryAudioTranscription } from "@/hooks/useRetryAudioTranscription";
import type { AttendanceMessageTranscription } from "@/types/audio-transcription";

// Failures where trying again cannot change the outcome (no speech detected).
const NON_RETRYABLE_ERROR_CODES = new Set(["EMPTY_TRANSCRIPTION"]);

const FAILURE_MESSAGES: Record<string, string> = {
  INVALID_API_KEY: "A chave de transcrição precisa ser corrigida por um administrador.",
  QUOTA_EXCEEDED: "A chave de transcrição está sem crédito. Avise um administrador.",
  TRANSCRIPTION_KEY_UNAVAILABLE:
    "A transcrição está indisponível porque a chave não está ativa.",
  MEDIA_UNAVAILABLE: "Não foi possível acessar o áudio para transcrever.",
  FILE_TOO_LARGE: "O áudio é grande demais para ser transcrito.",
  AUDIO_REJECTED: "O formato do áudio não pôde ser transcrito.",
  EMPTY_TRANSCRIPTION: "Não foi possível identificar fala neste áudio.",
  PROVIDER_UNAVAILABLE: "O serviço de transcrição está indisponível no momento.",
};

type AudioTranscriptionProps = {
  workspaceId?: string;
  attendanceId?: string;
  messageId: string;
  transcription: AttendanceMessageTranscription;
};

export function AudioTranscription({
  workspaceId,
  attendanceId,
  messageId,
  transcription,
}: AudioTranscriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const retry = useRetryAudioTranscription();
  const text = transcription.text?.trim();

  // Only offer the toggle when the collapsed text is actually truncated.
  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return;
    const measure = () =>
      setOverflows(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, expanded]);

  if (transcription.status === "PENDING") {
    return (
      <div
        className="mt-2 flex items-center gap-2 text-xs opacity-75"
        role="status"
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        Transcrevendo áudio…
      </div>
    );
  }

  if (transcription.status === "FAILED") {
    const message =
      (transcription.errorCode && FAILURE_MESSAGES[transcription.errorCode]) ||
      "Não foi possível transcrever este áudio.";
    const canRetry =
      Boolean(workspaceId && attendanceId) &&
      !(transcription.errorCode && NON_RETRYABLE_ERROR_CODES.has(transcription.errorCode));

    return (
      <div className="mt-2 space-y-1 text-xs" role="alert">
        <p className="flex items-start gap-1.5 opacity-90">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          {message}
        </p>
        {canRetry ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={retry.isPending}
            onClick={() =>
              retry.mutate({
                workspaceId: workspaceId as string,
                attendanceId: attendanceId as string,
                messageId,
              })
            }
          >
            {retry.isPending ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="mr-1 h-3 w-3" aria-hidden="true" />
            )}
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  if (!text) return null;

  const canToggle = overflows || expanded;

  return (
    <div className="mt-2 flex items-end gap-2 text-sm">
      <p
        ref={textRef}
        className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {text}
      </p>
      {canToggle ? (
        <button
          type="button"
          className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
          aria-expanded={expanded}
          aria-label={expanded ? "Recolher transcrição" : "Expandir transcrição"}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? (
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      ) : null}
    </div>
  );
}
