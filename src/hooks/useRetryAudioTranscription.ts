import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { retryAttendanceAudioTranscription } from "@/services/operation/retryAttendanceAudioTranscription";
import type { RetryAudioTranscriptionParams } from "@/types/audio-transcription";
import { extractOperationalErrorCode } from "@/utils/operationalAttendanceErrors";

const RETRY_ERROR_MESSAGES: Record<string, string> = {
  TRANSCRIPTION_KEY_UNAVAILABLE:
    "A chave de transcrição não está ativa. Peça a um administrador para corrigir a configuração.",
  TRANSCRIPTION_NOT_RETRYABLE:
    "Esta transcrição já foi retomada. A mensagem foi atualizada.",
  MESSAGE_NOT_FOUND: "Não encontramos este áudio neste atendimento.",
  ATTENDANCE_NOT_FOUND: "Atendimento indisponível.",
};

export function useRetryAudioTranscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = ({ workspaceId, attendanceId }: RetryAudioTranscriptionParams) => {
    for (const area of ["attendance-timeline", "attendance-messages"]) {
      void queryClient.invalidateQueries({
        queryKey: ["operation", area, workspaceId, attendanceId],
      });
    }
  };

  return useMutation({
    mutationFn: retryAttendanceAudioTranscription,
    onSuccess: (_data, params) => refresh(params),
    onError: (error, params) => {
      const code = extractOperationalErrorCode(error);
      refresh(params);
      toast({
        variant: "destructive",
        title: "Não foi possível tentar novamente",
        description:
          (code && RETRY_ERROR_MESSAGES[code]) ||
          "Ocorreu um erro ao reenviar o áudio para transcrição.",
      });
    },
  });
}
