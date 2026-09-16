import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Mic,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { useOperationalAttendanceMutations } from "@/hooks/useOperationalAttendanceMutations";
import {
  useOperationalAttendanceTemplates,
} from "@/hooks/useOperationalAttendances";
import { useToast } from "@/hooks/use-toast";
import {
  AttendanceDetail,
  OperationalAttendanceTemplate,
  OperationalTemplateBinding,
  SendOperationalAttendanceMessageBody,
  SendOperationalAttendanceMessageResponse,
} from "@/types/operation-attendance";
import { getOperationalAttendanceErrorMessage } from "@/utils/operationalAttendanceErrors";
import { formatOperationalMessageStatus } from "@/utils/operationalMessageStatus";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AudioRecorder } from "@/components/chats/AudioRecorder";

const MAX_MEDIA_SIZE = 50 * 1024 * 1024;

const composerSchema = z.object({
  text: z.string().max(10000, "A mensagem deve ter no máximo 10000 caracteres."),
  caption: z.string().max(1000, "A legenda deve ter no máximo 1000 caracteres."),
});

type ComposerFormValues = z.infer<typeof composerSchema>;
type ComposerMode = "TEXT" | "MEDIA" | "TEMPLATE";

interface AttendanceComposerProps {
  workspaceId: string;
  attendance: AttendanceDetail;
  canOperate: boolean;
  onClaim?: () => void;
  claimPending?: boolean;
  sticky?: boolean;
  embedded?: boolean;
}

type TemplateComponent = Record<string, unknown>;

function getTemplateSlots(template?: OperationalAttendanceTemplate): string[] {
  if (!template || !Array.isArray(template.components)) return [];

  const slots: string[] = [];
  const variables = (value: unknown) =>
    typeof value === "string" ? value.match(/\{\{\s*\d+\s*\}\}/g) ?? [] : [];

  for (const component of template.components as TemplateComponent[]) {
    const type = String(component.type ?? "").toUpperCase();
    if (
      type === "HEADER" &&
      String(component.format ?? "").toUpperCase() === "TEXT"
    ) {
      variables(component.text).forEach((_value, index) =>
        slots.push(`header.${index + 1}`),
      );
    }
    if (type === "BODY") {
      variables(component.text).forEach((_value, index) =>
        slots.push(`body.${index + 1}`),
      );
    }
    if (type === "BUTTONS" && Array.isArray(component.buttons)) {
      (component.buttons as TemplateComponent[]).forEach(
        (button, buttonIndex) => {
          if (String(button.type ?? "").toUpperCase() !== "URL") return;
          variables(button.url).forEach((_value, index) =>
            slots.push(`button.${buttonIndex}.${index + 1}`),
          );
        },
      );
    }
  }

  return slots;
}

function getBindingSelectorValue(
  binding?: OperationalTemplateBinding,
): string {
  if (!binding || binding.source === "fixed") return "fixed";
  return `${binding.source}:${binding.field}`;
}

function isAllowedMediaType(file: File, mediaType: "image" | "audio" | "document") {
  if (mediaType === "image") return file.type.startsWith("image/");
  if (mediaType === "audio") {
    return file.type.startsWith("audio/") || file.type === "application/ogg";
  }
  return !file.type.startsWith("image/") && !file.type.startsWith("audio/");
}

function getMediaTypeFromFile(file: File): "image" | "audio" | "document" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/") || file.type === "application/ogg") {
    return "audio";
  }
  return "document";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttendanceComposer({
  workspaceId,
  attendance,
  canOperate,
  onClaim,
  claimPending = false,
  sticky = false,
  embedded = false,
}: AttendanceComposerProps) {
  const { toast } = useToast();
  const mutations = useOperationalAttendanceMutations(workspaceId);
  const statusAllowsSend = ["IN_PROGRESS", "PENDING"].includes(attendance.status);
  const isTemplateRequired =
    attendance.replyCapabilities.status === "TEMPLATE_REQUIRED";
  const canCompose =
    canOperate &&
    statusAllowsSend &&
    ["SERVICE_ALLOWED", "TEMPLATE_REQUIRED"].includes(
      attendance.replyCapabilities.status,
    );

  const supportedModes = useMemo<ComposerMode[]>(() => {
    if (!canCompose) return [];

    const modes: ComposerMode[] = [];
    if (attendance.replyCapabilities.supportsText) modes.push("TEXT");
    if (attendance.replyCapabilities.supportsMedia) modes.push("MEDIA");
    if (attendance.replyCapabilities.supportsTemplate) {
      modes.push("TEMPLATE");
    }
    return isTemplateRequired ? modes.filter((mode) => mode === "TEMPLATE") : modes;
  }, [
    attendance.replyCapabilities.supportsMedia,
    attendance.replyCapabilities.supportsTemplate,
    attendance.replyCapabilities.supportsText,
    canCompose,
    isTemplateRequired,
  ]);
  const canUseOptionalTemplate =
    supportedModes.includes("TEMPLATE") && !isTemplateRequired;

  const [mode, setMode] = useState<ComposerMode>(
    isTemplateRequired ? "TEMPLATE" : "TEXT",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "audio" | "document">(
    "image",
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateBindings, setTemplateBindings] = useState<
    Record<string, OperationalTemplateBinding>
  >({});
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [lastSent, setLastSent] =
    useState<SendOperationalAttendanceMessageResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<ComposerFormValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: { text: "", caption: "" },
  });
  const templatesQuery = useOperationalAttendanceTemplates(
    workspaceId,
    attendance.id,
    canCompose && attendance.replyCapabilities.supportsTemplate,
  );
  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId,
  ) ?? templates[0];
  const templateSlots = useMemo(
    () => getTemplateSlots(selectedTemplate),
    [selectedTemplate],
  );

  useEffect(() => {
    if (!supportedModes.includes(mode)) {
      setMode(supportedModes[0] ?? "TEXT");
    }
  }, [mode, supportedModes]);

  useEffect(() => {
    if (!templates.length) {
      setSelectedTemplateId(null);
      setTemplateBindings({});
      return;
    }

    const nextTemplate =
      templates.find((template) => template.id === selectedTemplateId) ?? templates[0];
    if (nextTemplate.id !== selectedTemplateId) {
      setSelectedTemplateId(nextTemplate.id);
    }
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    setTemplateBindings((current) => {
      const next: Record<string, OperationalTemplateBinding> = {};
      for (const slot of templateSlots) {
        next[slot] = current[slot] ?? { source: "fixed", value: "" };
      }
      return next;
    });
  }, [templateSlots]);

  const handleFileChange = (
    file: File | undefined,
    nextMediaType = mediaType,
    switchToMedia = false,
  ) => {
    if (!file) return;
    if (file.size > MAX_MEDIA_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "A mídia deve ter no máximo 50 MB.",
        variant: "destructive",
      });
      return;
    }
    if (!isAllowedMediaType(file, nextMediaType)) {
      toast({
        title: "Tipo de mídia incompatível",
        description: `Selecione um arquivo compatível com ${nextMediaType}.`,
        variant: "destructive",
      });
      return;
    }
    setMediaType(nextMediaType);
    setSelectedFile(file);
    if (switchToMedia) setMode("MEDIA");
  };

  const updateBinding = (slot: string, value: string) => {
    setTemplateBindings((current) => {
      const previous = current[slot];
      if (value === "fixed") {
        return {
          ...current,
          [slot]: {
            source: "fixed",
            value: previous?.source === "fixed" ? previous.value : "",
          },
        };
      }
      if (value === "customer:name") {
        return { ...current, [slot]: { source: "customer", field: "name" } };
      }
      if (value === "customer:firstName") {
        return {
          ...current,
          [slot]: { source: "customer", field: "firstName" },
        };
      }
      if (value === "customer:phone") {
        return { ...current, [slot]: { source: "customer", field: "phone" } };
      }
      if (value === "customer:email") {
        return { ...current, [slot]: { source: "customer", field: "email" } };
      }
      return { ...current, [slot]: { source: "owner", field: "name" } };
    });
  };

  const showSendResult = (response: SendOperationalAttendanceMessageResponse) => {
    setLastSent(response);
    toast({
      title: response.duplicate ? "Mensagem já processada" : "Mensagem enviada",
      description: response.duplicate
        ? "O servidor reconheceu uma tentativa anterior com a mesma chave."
        : "O envio foi registrado e acompanharemos o status do provedor.",
    });
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    if (
      !canCompose ||
      !supportedModes.includes("MEDIA") ||
      mutations.sendMessage.isPending
    ) {
      return;
    }

    setIsRecordingAudio(false);
    const audioFile = new File([audioBlob], `audio-${Date.now()}.ogg`, {
      type: "audio/ogg; codecs=opus",
    });

    try {
      const response = await mutations.sendMessage.mutateAsync({
        attendanceId: attendance.id,
        body: {
          kind: "MEDIA",
          expectedVersion: attendance.version,
          mediaType: "audio",
        },
        file: audioFile,
      });
      showSendResult(response);
    } catch (error) {
      toast({
        title: "Não foi possível enviar o áudio",
        description: getOperationalAttendanceErrorMessage(
          error,
          "Atualize o atendimento e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const submit = async (values: ComposerFormValues) => {
    if (!supportedModes.includes(mode)) return;

    let body: SendOperationalAttendanceMessageBody;
    let file: File | undefined;

    if (mode === "TEXT") {
      if (!values.text.trim()) {
        form.setError("text", { message: "Informe uma mensagem." });
        return;
      }
      body = {
        kind: "TEXT",
        expectedVersion: attendance.version,
        text: values.text.trim(),
      };
    } else if (mode === "MEDIA") {
      if (!selectedFile) {
        toast({
          title: "Mídia não selecionada",
          description: "Escolha um arquivo antes de enviar.",
          variant: "destructive",
        });
        return;
      }
      if (!isAllowedMediaType(selectedFile, mediaType)) {
        toast({
          title: "Tipo de mídia incompatível",
          description: "Selecione outro arquivo ou ajuste o tipo de mídia.",
          variant: "destructive",
        });
        return;
      }
      body = {
        kind: "MEDIA",
        expectedVersion: attendance.version,
        mediaType,
        caption: values.caption.trim() || undefined,
      };
      file = selectedFile;
    } else {
      if (!selectedTemplate) {
        toast({
          title: "Template não selecionado",
          description: "Escolha um template aprovado para continuar.",
          variant: "destructive",
        });
        return;
      }
      const missingSlot = templateSlots.find((slot) => {
        const binding = templateBindings[slot];
        return binding?.source === "fixed" && !binding.value.trim();
      });
      if (missingSlot) {
        toast({
          title: "Parâmetro incompleto",
          description: `Informe um valor fixo para ${missingSlot} ou selecione uma origem dinâmica.`,
          variant: "destructive",
        });
        return;
      }
      const bindings = Object.fromEntries(
        templateSlots.map((slot) => [slot, templateBindings[slot]]),
      );
      body = {
        kind: "TEMPLATE",
        expectedVersion: attendance.version,
        templateId: selectedTemplate.id,
        bindings: templateSlots.length ? bindings : undefined,
      };
    }

    try {
      const response = await mutations.sendMessage.mutateAsync({
        attendanceId: attendance.id,
        body,
        file,
      });
      form.reset({ text: "", caption: "" });
      setSelectedFile(null);
      if (mode !== "TEXT" && !isTemplateRequired) setMode("TEXT");
      showSendResult(response);
    } catch (error) {
      toast({
        title: "Não foi possível enviar a mensagem",
        description: getOperationalAttendanceErrorMessage(
          error,
          "Atualize o atendimento e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  const disabledReason = !canOperate
    ? "Você precisa da permissão para operar atendimentos."
    : attendance.status === "WAITING_QUEUE"
      ? "Você precisa assumir esta conversa para responder."
      : attendance.status === "TRIAGE"
        ? "Encaminhe este atendimento para uma fila antes de responder."
        : attendance.status === "CLOSED"
          ? "Este atendimento foi encerrado e não aceita novas respostas."
          : attendance.replyCapabilities.status === "NOT_ASSIGNEE"
      ? "Somente o responsável atual pode responder este atendimento."
      : attendance.replyCapabilities.status === "CHANNEL_UNAVAILABLE"
        ? "O canal do atendimento não está disponível."
        : !statusAllowsSend
          ? "O atendimento precisa estar em andamento ou pendente."
          : "Não há um modo de resposta disponível para este canal.";

  return (
    <div
      className={
        sticky
          ? embedded
            ? "sticky bottom-0 z-10 shrink-0 border-t bg-background/95 px-4 pb-3 pt-3 backdrop-blur"
            : "sticky bottom-0 z-10 -mx-6 border-t bg-background/95 px-6 pb-1 pt-4 backdrop-blur"
          : "mt-6 border-t pt-6"
      }
    >
      {isTemplateRequired ? (
        <p
          className={
            embedded
              ? "mb-3 text-xs text-muted-foreground"
              : "mb-4 text-sm text-muted-foreground"
          }
        >
          A janela de 24 horas foi encerrada. Para iniciar uma nova conversa,
          envie um template aprovado.
        </p>
      ) : null}

      {!canCompose ? (
        <Alert className="bg-muted/20">
          <AlertTitle>
            {attendance.status === "WAITING_QUEUE" && onClaim
              ? "Assuma para responder"
              : "Resposta indisponível"}
          </AlertTitle>
          <AlertDescription className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <span>{disabledReason}</span>
            {attendance.status === "WAITING_QUEUE" && onClaim ? (
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={claimPending}
                onClick={onClaim}
              >
                {claimPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {claimPending ? "Assumindo..." : "Atender"}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : supportedModes.length === 0 ? (
        <Alert>
          <AlertTitle>Nenhum modo compatível</AlertTitle>
          <AlertDescription>
            O canal não informou suporte a texto, mídia ou template para este atendimento.
          </AlertDescription>
        </Alert>
      ) : isRecordingAudio && mode === "TEXT" ? (
        <AudioRecorder
          onSend={(audioBlob) => void handleSendAudio(audioBlob)}
          onCancel={() => setIsRecordingAudio(false)}
        />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className={embedded ? "space-y-2" : "space-y-4"}
          >
            {mode === "TEXT" ? (
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="sr-only">Mensagem</FormLabel>
                    <div className="flex items-center gap-2">
                      {canUseOptionalTemplate ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => setMode("TEMPLATE")}
                          disabled={mutations.sendMessage.isPending}
                          aria-label="Usar template"
                        >
                          <FileText className="h-5 w-5" />
                        </Button>
                      ) : null}
                      {supportedModes.includes("MEDIA") ? (
                        <>
                          <input
                            ref={fileInputRef}
                            id="operational-media-file-compact"
                            type="file"
                            className="sr-only"
                            accept="image/*,audio/*,application/ogg,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                handleFileChange(
                                  file,
                                  getMediaTypeFromFile(file),
                                  true,
                                );
                              }
                              event.currentTarget.value = "";
                            }}
                            disabled={mutations.sendMessage.isPending}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={mutations.sendMessage.isPending}
                            aria-label="Adicionar anexo"
                          >
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        </>
                      ) : null}
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Digite uma mensagem"
                          disabled={mutations.sendMessage.isPending}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              void form.handleSubmit(submit)();
                            }
                          }}
                          className="min-h-[40px] max-h-[120px] flex-1 resize-none"
                          rows={1}
                        />
                      </FormControl>
                      {field.value.trim() ? (
                        <Button
                          type="submit"
                          size="icon"
                          className="shrink-0"
                          disabled={mutations.sendMessage.isPending}
                          aria-label="Enviar mensagem"
                        >
                          {mutations.sendMessage.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      ) : supportedModes.includes("MEDIA") ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => setIsRecordingAudio(true)}
                          disabled={mutations.sendMessage.isPending}
                          aria-label="Gravar áudio"
                        >
                          <Mic className="h-5 w-5" />
                        </Button>
                      ) : null}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {mode === "MEDIA" ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <Label htmlFor="operational-media-type">Tipo</Label>
                    <select
                      id="operational-media-type"
                      value={mediaType}
                      onChange={(event) => {
                        const nextType = event.target.value as typeof mediaType;
                        setMediaType(nextType);
                        if (selectedFile && !isAllowedMediaType(selectedFile, nextType)) {
                          setSelectedFile(null);
                          setMode("TEXT");
                        }
                      }}
                      disabled={mutations.sendMessage.isPending}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="image">Imagem</option>
                      <option value="audio">Áudio</option>
                      <option value="document">Documento</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operational-media-file">Arquivo</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="operational-media-file"
                        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
                      >
                        <Paperclip className="h-4 w-4" />
                        Selecionar arquivo
                      </label>
                      <input
                        id="operational-media-file"
                        type="file"
                        className="sr-only"
                        accept={
                          mediaType === "image"
                            ? "image/*"
                            : mediaType === "audio"
                              ? "audio/*,application/ogg"
                              : undefined
                        }
                        onChange={(event) => handleFileChange(event.target.files?.[0])}
                        disabled={mutations.sendMessage.isPending}
                      />
                      <span className="text-xs text-muted-foreground">Até 50 MB</span>
                    </div>
                  </div>
                </div>
                {selectedFile ? (
                  <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{selectedFile.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        setMode("TEXT");
                      }}
                      disabled={mutations.sendMessage.isPending}
                      aria-label="Remover arquivo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legenda (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Adicione uma legenda para a mídia..."
                          disabled={mutations.sendMessage.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            {mode === "TEMPLATE" ? (
              <div className="space-y-4 rounded-md border bg-muted/10 p-4">
                {!isTemplateRequired ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode("TEXT")}
                    >
                      Voltar para mensagem
                    </Button>
                  </div>
                ) : null}
                {templatesQuery.isError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Catálogo de templates indisponível</AlertTitle>
                    <AlertDescription className="flex flex-wrap items-center gap-3">
                      {getOperationalAttendanceErrorMessage(
                        templatesQuery.error,
                        "Não foi possível carregar os templates aprovados.",
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void templatesQuery.refetch()}
                      >
                        Tentar novamente
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : templatesQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando templates aprovados...
                  </div>
                ) : templates.length === 0 ? (
                  <Alert>
                    <AlertTitle>Nenhum template disponível</AlertTitle>
                    <AlertDescription>
                      Sincronize um template aprovado e tente novamente.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="operational-template">Template aprovado</Label>
                      <select
                        id="operational-template"
                        value={selectedTemplate?.id ?? ""}
                        onChange={(event) => setSelectedTemplateId(event.target.value)}
                        disabled={mutations.sendMessage.isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} · {template.language}
                          </option>
                        ))}
                      </select>
                    </div>

                    {templateSlots.length ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Parâmetros</p>
                        {templateSlots.map((slot) => {
                          const binding = templateBindings[slot];
                          return (
                            <div key={slot} className="grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)]">
                              <div className="space-y-2">
                                <Label htmlFor={`binding-source-${slot}`}>{slot}</Label>
                                <select
                                  id={`binding-source-${slot}`}
                                  value={getBindingSelectorValue(binding)}
                                  onChange={(event) => updateBinding(slot, event.target.value)}
                                  disabled={mutations.sendMessage.isPending}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                  <option value="fixed">Valor fixo</option>
                                  <option value="customer:name">Cliente · nome</option>
                                  <option value="customer:firstName">Cliente · primeiro nome</option>
                                  <option value="customer:phone">Cliente · telefone</option>
                                  <option value="customer:email">Cliente · e-mail</option>
                                  <option value="owner:name">Responsável · nome</option>
                                </select>
                              </div>
                              {binding?.source === "fixed" ? (
                                <div className="space-y-2">
                                  <Label htmlFor={`binding-value-${slot}`}>Valor</Label>
                                  <Input
                                    id={`binding-value-${slot}`}
                                    value={binding.value}
                                    onChange={(event) =>
                                      setTemplateBindings((current) => ({
                                        ...current,
                                        [slot]: { source: "fixed", value: event.target.value },
                                      }))
                                    }
                                    disabled={mutations.sendMessage.isPending}
                                    placeholder="Informe o valor"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-end pb-2 text-sm text-muted-foreground">
                                  Valor preenchido a partir do cadastro autorizado.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Este template não possui parâmetros variáveis.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : null}

            {mode !== "TEXT" ? (
              <div className="flex justify-end gap-3">
                <Button type="submit" disabled={mutations.sendMessage.isPending}>
                  {mutations.sendMessage.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {mutations.sendMessage.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            ) : null}
          </form>
        </Form>
      )}

      {lastSent ? (
        <div className="mt-4 rounded-md border bg-muted/20 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Última tentativa</span>
            <Badge variant="outline">
              {formatOperationalMessageStatus(lastSent.message.dispatchStatus)}
            </Badge>
            {lastSent.message.deliveryStatus ? (
              <Badge variant="outline">
                {formatOperationalMessageStatus(lastSent.message.deliveryStatus)}
              </Badge>
            ) : null}
            {lastSent.duplicate ? (
              <Badge variant="secondary">Reenvio ignorado</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            A mensagem também aparece na conversa após a atualização do histórico.
          </p>
        </div>
      ) : null}
    </div>
  );
}
