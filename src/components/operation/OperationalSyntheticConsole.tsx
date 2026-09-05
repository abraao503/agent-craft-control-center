import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  FlaskConical,
  Loader2,
  MessageSquare,
  PlayCircle,
} from "lucide-react";
import { useOperationalChannels } from "@/hooks/useOperationalChannels";
import { usePermissions } from "@/hooks/usePermissions";
import { runSyntheticOperationalChannelEvent } from "@/services/operation/runSyntheticOperationalChannelEvent";
import { getOperationalErrorMessage } from "@/components/operation/operationalChannelLabels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function OperationalSyntheticConsole({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { has } = usePermissions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const canRunHarness = has("manage:operation-channels");
  const channelsQuery = useOperationalChannels(
    workspaceId,
    1,
    canRunHarness,
  );
  const [channelId, setChannelId] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const channels = channelsQuery.data?.items ?? [];
  const activeChannels = channels.filter((channel) => channel.active);

  useEffect(() => {
    if (!channelId && activeChannels[0]) {
      setChannelId(activeChannels[0].id);
    }
  }, [activeChannels, channelId]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!channelId || !phone.trim() || !content.trim()) {
        throw new Error("Selecione um canal e preencha telefone e mensagem.");
      }

      return runSyntheticOperationalChannelEvent(workspaceId, {
        channelId,
        externalEventId: `synthetic-event-${crypto.randomUUID()}`,
        externalMessageId: `synthetic-message-${crypto.randomUUID()}`,
        occurredAt: new Date().toISOString(),
        contact: {
          phone: phone.trim(),
          ...(name.trim() ? { name: name.trim() } : {}),
        },
        message: {
          type: "text",
          content: content.trim(),
        },
      });
    },
    onSuccess: (result) => {
      setFormError(null);
      toast({
        title: result.duplicate ? "Mensagem já processada" : "Mensagem sintética criada",
        description: result.attendanceId
          ? "O atendimento foi aberto e será exibido agora."
          : "O evento foi aceito; aguarde o processamento concluir a criação do atendimento.",
      });
      if (result.attendanceId) {
        navigate(`/operation/attendances/${result.attendanceId}`);
      }
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!channelId || !phone.trim() || !content.trim()) {
      setFormError("Selecione um canal e preencha telefone e mensagem.");
      return;
    }

    setFormError(null);
    mutation.mutate();
  };

  if (!canRunHarness) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Console sintético
        </CardTitle>
        <CardDescription>
          Crie uma mensagem controlada no canal selecionado para validar a rota
          de agente externo e abrir o atendimento sem enviar nada a um provedor
          real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {channelsQuery.isLoading ? (
          <div className="flex min-h-20 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando canais ativos...
          </div>
        ) : channelsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Console indisponível</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os canais deste ambiente.
            </AlertDescription>
          </Alert>
        ) : !activeChannels.length ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nenhum canal ativo</AlertTitle>
            <AlertDescription>
              Ative ou crie um canal antes de executar uma mensagem sintética.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {formError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            {mutation.isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Não foi possível executar a simulação</AlertTitle>
                <AlertDescription>
                  {getOperationalErrorMessage(
                    mutation.error,
                    "Verifique se o canal possui uma rota válida e tente novamente.",
                  )}
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="synthetic-channel">Canal</Label>
                <Select value={channelId} onValueChange={setChannelId}>
                  <SelectTrigger id="synthetic-channel">
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeChannels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.displayName || channel.providerAlias}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Telefone" htmlFor="synthetic-phone">
                <Input
                  id="synthetic-phone"
                  placeholder="5511999999999"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </Field>
            </div>
            <Field label="Nome do contato" htmlFor="synthetic-name">
              <Input
                id="synthetic-name"
                placeholder="Cliente sintético"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field label="Mensagem" htmlFor="synthetic-message">
              <Textarea
                id="synthetic-message"
                placeholder="Preciso de ajuda com meu pedido"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={4}
              />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                IDs externos e idempotência são gerados para cada execução.
              </p>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                {mutation.isPending ? "Executando..." : "Criar mensagem"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
