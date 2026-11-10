import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, Mic, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useAudioTranscriptionConfiguration,
  useDeleteAudioTranscriptionConfiguration,
  useSaveAudioTranscriptionConfiguration,
} from "@/hooks/useAudioTranscriptionConfiguration";
import type { AudioTranscriptionKeyStatus } from "@/types/audio-transcription";
import { extractOperationalErrorCode } from "@/utils/operationalAttendanceErrors";
import { AUDIO_TRANSCRIPTION_CONFIG_ANCHOR } from "@/components/operation/AudioTranscriptionKeyAlert";

const STATUS_LABELS: Record<AudioTranscriptionKeyStatus, string> = {
  ACTIVE: "Ativa",
  INVALID: "Inválida",
  QUOTA_EXCEEDED: "Sem crédito",
};

const SAVE_ERRORS: Record<string, string> = {
  INVALID_API_KEY: "A OpenAI recusou esta chave. Confira se ela está correta e ativa.",
  PROVIDER_UNAVAILABLE:
    "Não foi possível validar a chave agora porque a OpenAI está indisponível. Tente novamente em instantes.",
  AUDIO_TRANSCRIPTION_ENCRYPTION_NOT_CONFIGURED:
    "O servidor ainda não está preparado para guardar chaves. Fale com o suporte.",
};

function formatChecked(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("pt-BR");
}

export function AudioTranscriptionConfigCard() {
  const { toast } = useToast();
  const configuration = useAudioTranscriptionConfiguration(true);
  const save = useSaveAudioTranscriptionConfiguration();
  const remove = useDeleteAudioTranscriptionConfiguration();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { hash } = useLocation();

  // The alert links here with a hash; SPA navigation does not scroll by itself.
  useEffect(() => {
    if (hash !== `#${AUDIO_TRANSCRIPTION_CONFIG_ANCHOR}`) return;
    document
      .getElementById(AUDIO_TRANSCRIPTION_CONFIG_ANCHOR)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const data = configuration.data;
  const lastChecked = formatChecked(data?.lastCheckedAt ?? null);
  const trimmedKey = apiKey.trim();

  const handleSave = () => {
    setError(null);
    save.mutate(
      { apiKey: trimmedKey },
      {
        onSuccess: () => {
          setApiKey("");
          toast({ title: "Chave validada e salva" });
        },
        onError: (err) => {
          const code = extractOperationalErrorCode(err);
          setError(
            (code && SAVE_ERRORS[code]) ||
              "Não foi possível salvar a chave. Verifique o valor informado.",
          );
        },
      },
    );
  };

  const handleRemove = () => {
    setError(null);
    remove.mutate(undefined, {
      onSuccess: () => toast({ title: "Chave removida" }),
      onError: () =>
        setError("Não foi possível remover a chave. Tente novamente."),
    });
  };

  return (
    <Card id={AUDIO_TRANSCRIPTION_CONFIG_ANCHOR} className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="h-5 w-5 text-primary" />
          Transcrição de áudios
        </CardTitle>
        <CardDescription>
          Informe a chave de API da OpenAI da empresa. Os áudios recebidos dos
          clientes no chat operacional passam a ser transcritos
          automaticamente. A chave é validada antes de ser salva.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {configuration.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando configuração…
          </div>
        ) : configuration.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar a configuração da transcrição.
            </AlertDescription>
          </Alert>
        ) : data?.configured && data.status ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
            <Badge variant={data.status === "ACTIVE" ? "default" : "destructive"}>
              {STATUS_LABELS[data.status]}
            </Badge>
            <span className="font-mono">••••{data.keyLastFour}</span>
            {lastChecked ? (
              <span className="text-muted-foreground">
                Última verificação: {lastChecked}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto"
              disabled={remove.isPending}
              onClick={handleRemove}
            >
              {remove.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remover chave
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma chave configurada. Os áudios não estão sendo transcritos.
          </p>
        )}

        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmedKey) handleSave();
          }}
          autoComplete="off"
        >
          <Label htmlFor="audio-transcription-api-key">
            {data?.configured ? "Substituir chave" : "Chave de API da OpenAI"}
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="audio-transcription-api-key"
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              placeholder="Cole a chave de API"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              disabled={save.isPending}
            />
            <Button type="submit" disabled={!trimmedKey || save.isPending}>
              {save.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Validar e salvar
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
