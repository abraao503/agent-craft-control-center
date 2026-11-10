import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { useAudioTranscriptionConfiguration } from "@/hooks/useAudioTranscriptionConfiguration";
import { usePermissions } from "@/hooks/usePermissions";

export const AUDIO_TRANSCRIPTION_CONFIG_ANCHOR = "audio-transcription-config";

const CAUSES = {
  INVALID: {
    title: "A chave de transcrição de áudios é inválida",
    description:
      "A OpenAI recusou a chave (ela pode ter expirado ou sido revogada). Os novos áudios não estão sendo transcritos até que você informe uma chave válida.",
  },
  QUOTA_EXCEEDED: {
    title: "A chave de transcrição de áudios está sem crédito",
    description:
      "A conta da OpenAI não tem mais crédito ou atingiu o limite. Adicione crédito ou troque a chave para voltar a transcrever os áudios.",
  },
} as const;

/** Visible only to users who can manage the operation setup. */
export function AudioTranscriptionKeyAlert() {
  const { has } = usePermissions();
  const isAdmin = has("manage:operation-setup");
  const { data } = useAudioTranscriptionConfiguration(isAdmin);

  if (!isAdmin || !data?.configured) return null;
  if (data.status !== "INVALID" && data.status !== "QUOTA_EXCEEDED") return null;

  const cause = CAUSES[data.status];

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{cause.title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        <span>{cause.description}</span>
        <Link
          to={`/operation#${AUDIO_TRANSCRIPTION_CONFIG_ANCHOR}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Corrigir configuração
        </Link>
      </AlertDescription>
    </Alert>
  );
}
