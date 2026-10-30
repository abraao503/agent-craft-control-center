import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  LockKeyhole,
  Loader2,
  Mic,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { useOperationalAttendanceMutations } from "@/hooks/useOperationalAttendanceMutations";
import { useOperationalAttendanceTemplateCatalog } from "@/hooks/useOperationalAttendances";
import { useToast } from "@/hooks/use-toast";
import {
  AttendanceDetail,
  OperationalAttendanceTemplate,
  OperationalTemplateBinding,
  SendOperationalAttendanceMessageBody,
} from "@/types/operation-attendance";
import { getOperationalAttendanceErrorMessage } from "@/utils/operationalAttendanceErrors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AudioRecorder } from "@/components/chats/AudioRecorder";
import { TemplateMessage } from "@/components/chats/media/TemplateMessage";
import { WhisperIcon } from "@/components/operation/WhisperIcon";

const MAX_MEDIA_SIZE = 50 * 1024 * 1024;

const composerSchema = z.object({
  text: z.string().max(10000, "A mensagem deve ter no máximo 10000 caracteres."),
  caption: z.string().max(1000, "A legenda deve ter no máximo 1000 caracteres."),
});

type ComposerFormValues = z.infer<typeof composerSchema>;
type ComposerMode = "TEXT" | "MEDIA" | "TEMPLATE";

interface QueuedAttendanceSend {
  workspaceId: string;
  attendanceId: string;
  body: SendOperationalAttendanceMessageBody;
  file?: File;
  errorTitle: string;
}

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
          const type = String(button.type ?? "").toUpperCase();
          if (type === "COPY_CODE") {
            slots.push(`button.${buttonIndex}.1`);
            return;
          }
          if (type !== "URL") return;
          variables(button.url).forEach((_value, index) =>
              slots.push(`button.${buttonIndex}.${index + 1}`),
            );
        },
      );
    }
  }

  return slots;
}

function renderTemplateText(
  text: unknown,
  bindings: Record<string, OperationalTemplateBinding>,
  component: string,
) {
  if (typeof text !== "string") return "";

  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_match, index: string) => {
    const slot = `${component}.${Number(index)}`;
    const binding = bindings[slot];
    if (!binding) return `{{${index}}}`;
    if (binding.source === "fixed") return binding.value || `{{${index}}}`;
    return `[${binding.source === "customer" ? "Cliente" : "Responsável"}: ${binding.field}]`;
  });
}

function getTemplatePreviewSnapshot(
  template: OperationalAttendanceTemplate | undefined,
  bindings: Record<string, OperationalTemplateBinding>,
) {
  if (!template || !Array.isArray(template.components)) return null;

  const components = template.components as TemplateComponent[];
  const header = components.find(
    (component) =>
      String(component.type ?? "").toUpperCase() === "HEADER" &&
      String(component.format ?? "").toUpperCase() === "TEXT",
  );
  const body = components.find(
    (component) => String(component.type ?? "").toUpperCase() === "BODY",
  );
  const footer = components.find(
    (component) => String(component.type ?? "").toUpperCase() === "FOOTER",
  );
  const buttonsComponent = components.find(
    (component) => String(component.type ?? "").toUpperCase() === "BUTTONS",
  );
  const buttons = Array.isArray(buttonsComponent?.buttons)
    ? (buttonsComponent.buttons as TemplateComponent[]).map(
        (button, buttonIndex) => {
          const type = String(button.type ?? "").toUpperCase();
          const result: Record<string, unknown> = {
            type,
            text: typeof button.text === "string" ? button.text : "",
          };

          if (type === "URL") {
            result.url = renderTemplateText(
              button.url,
              bindings,
              `button.${buttonIndex}`,
            );
          }
          if (type === "PHONE_NUMBER") {
            result.phoneNumber = button.phone_number;
          }
          if (type === "COPY_CODE") {
            const codeBinding = bindings[`button.${buttonIndex}.1`];
            result.code =
              codeBinding?.source === "fixed"
                ? codeBinding.value
                : Array.isArray(button.example)
                  ? button.example[0]
                  : undefined;
          }

          return result;
        },
      )
    : [];

  return {
    header: renderTemplateText(header?.text, bindings, "header") || null,
    body: renderTemplateText(body?.text, bindings, "body"),
    footer: typeof footer?.text === "string" ? footer.text : null,
    buttons,
  };
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
  const canUseInternalNote = canOperate;

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
  const [isInternalNoteMode, setIsInternalNoteMode] = useState(false);
  const [templateCollapsed, setTemplateCollapsed] = useState(false);

  useEffect(() => {
    setTemplateCollapsed(false);
  }, [attendance.id, mode]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "audio" | "document">(
    "image",
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateBindings, setTemplateBindings] = useState<
    Record<string, OperationalTemplateBinding>
  >({});
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<ComposerFormValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: { text: "", caption: "" },
  });
  const sendQueueRef = useRef<QueuedAttendanceSend[]>([]);
  const isProcessingSendQueueRef = useRef(false);

  const processSendQueue = async () => {
    if (isProcessingSendQueueRef.current) return;

    isProcessingSendQueueRef.current = true;
    try {
      while (sendQueueRef.current.length > 0) {
        const queuedSend = sendQueueRef.current.shift();
        if (!queuedSend) continue;

        try {
          await mutations.sendMessage.mutateAsync({
            workspaceId: queuedSend.workspaceId,
            attendanceId: queuedSend.attendanceId,
            body: queuedSend.body,
            file: queuedSend.file,
          });
        } catch (error) {
          toast({
            title: queuedSend.errorTitle,
            description: getOperationalAttendanceErrorMessage(
              error,
              "Atualize o atendimento e tente novamente.",
            ),
            variant: "destructive",
          });
        }
      }
    } finally {
      isProcessingSendQueueRef.current = false;
    }
  };

  const enqueueSend = (queuedSend: QueuedAttendanceSend) => {
    sendQueueRef.current.push(queuedSend);
    void processSendQueue();
  };
  const templateCatalogQuery = useOperationalAttendanceTemplateCatalog(
    workspaceId,
    attendance.id,
    attendance.companyWhatsappIntegrationId,
    attendance.channel?.provider,
    canCompose,
  );
  const templates = useMemo(
    () => templateCatalogQuery.data?.templates ?? [],
    [templateCatalogQuery.data?.templates],
  );
  const catalogStatus = templateCatalogQuery.data?.status;
  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId,
  ) ?? templates[0];
  const templateSlots = useMemo(
    () => getTemplateSlots(selectedTemplate),
    [selectedTemplate],
  );
  const templatePreview = useMemo(
    () => getTemplatePreviewSnapshot(selectedTemplate, templateBindings),
    [selectedTemplate, templateBindings],
  );

  useEffect(() => {
    if (!supportedModes.includes(mode)) {
      setMode(supportedModes[0] ?? "TEXT");
    }
  }, [mode, supportedModes]);

  useEffect(() => {
    if (!canUseInternalNote) {
      setIsInternalNoteMode(false);
    }
  }, [canUseInternalNote]);

  useEffect(() => {
    setSelectedTemplateId(null);
    setTemplateBindings({});
  }, [attendance.channel?.provider, attendance.companyWhatsappIntegrationId]);

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

  const handleSendAudio = (audioBlob: Blob) => {
    if (
      !canCompose ||
      !supportedModes.includes("MEDIA") ||
      mutations.createInternalNote.isPending
    ) {
      return;
    }

    setIsRecordingAudio(false);
    const audioFile = new File([audioBlob], `audio-${Date.now()}.ogg`, {
      type: "audio/ogg; codecs=opus",
    });

    enqueueSend({
      workspaceId,
      attendanceId: attendance.id,
      body: {
        kind: "MEDIA",
        expectedVersion: attendance.version,
        mediaType: "audio",
      },
      file: audioFile,
      errorTitle: "Não foi possível enviar o áudio",
    });
  };

  const submit = async (values: ComposerFormValues) => {
    if (isInternalNoteMode) {
      const content = values.text.trim();
      if (!content) {
        form.setError("text", { message: "Informe uma nota interna." });
        return;
      }
      if (mutations.createInternalNote.isPending) return;

      try {
        await mutations.createInternalNote.mutateAsync({
          attendanceId: attendance.id,
          content,
        });
        form.reset({ text: "", caption: "" });
      } catch (error) {
        toast({
          title: "Não foi possível salvar a nota interna",
          description: getOperationalAttendanceErrorMessage(
            error,
            "Atualize o atendimento e tente novamente.",
          ),
          variant: "destructive",
        });
      }
      return;
    }

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

    enqueueSend({
      workspaceId,
      attendanceId: attendance.id,
      body,
      file,
      errorTitle: "Não foi possível enviar a mensagem",
    });
    form.reset({ text: "", caption: "" });
    setSelectedFile(null);
    setSelectedTemplateId(null);
    setTemplateBindings({});
    if (mode !== "TEXT" && !isTemplateRequired) setMode("TEXT");
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

  const catalogFeedback = templateCatalogQuery.isError
    ? {
        title: "Catálogo de templates indisponível",
        description: getOperationalAttendanceErrorMessage(
          templateCatalogQuery.error,
          "Não foi possível carregar os templates aprovados.",
        ),
      }
    : catalogStatus === "NO_APPROVED_TEMPLATES"
        ? {
            title: "Nenhum template aprovado disponível",
            description:
              "Sincronize os templates aprovados na página Canais, na configuração deste canal.",
          }
        : catalogStatus === "NO_COMPATIBLE_TEMPLATES"
          ? {
              title: "Nenhum template compatível disponível",
              description:
                "A conta possui templates aprovados, mas nenhum é compatível com este canal ou atendimento.",
            }
          : null;

  return (
    <div
      className={[
        sticky
          ? embedded
            ? "sticky bottom-0 z-10 shrink-0 border-t bg-background/95 px-4 pb-3 pt-3 backdrop-blur"
            : "sticky bottom-0 z-10 -mx-6 border-t bg-background/95 px-6 pb-1 pt-4 backdrop-blur"
          : "mt-6 border-t pt-6",
        mode === "TEMPLATE" && !templateCollapsed
          ? "[container-type:inline-size] flex max-h-[calc(100dvh-22rem)] min-h-0 flex-col overflow-hidden xl:max-h-full"
          : "",
      ].join(" ")}
    >
      {mode === "TEMPLATE" && canCompose ? (
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium">
            {templateCollapsed && selectedTemplate ? selectedTemplate.name : "Mensagem por template"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-expanded={!templateCollapsed}
            aria-controls="operational-template-form"
            onClick={() => setTemplateCollapsed((collapsed) => !collapsed)}
          >
            {templateCollapsed ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {templateCollapsed ? "Expandir template" : "Recolher template"}
          </Button>
        </div>
      ) : null}
      {isTemplateRequired && !templateCollapsed ? (
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

      {canCompose && catalogFeedback ? (
        <Alert
          variant={templateCatalogQuery.isError ? "destructive" : "default"}
          className="mb-3"
        >
          <AlertTitle>{catalogFeedback.title}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{catalogFeedback.description}</span>
          </AlertDescription>
        </Alert>
      ) : null}

      {!canCompose && !isInternalNoteMode ? (
        <Alert className="bg-muted/20">
          <AlertTitle>
            {attendance.status === "WAITING_QUEUE" && onClaim
              ? "Assuma para responder"
              : "Resposta indisponível"}
          </AlertTitle>
          <AlertDescription className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <span>{disabledReason}</span>
            <div className="flex flex-wrap items-center gap-2">
              {canUseInternalNote ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setIsInternalNoteMode(true)}
                  aria-label="Ativar modo sussurro"
                >
                  <WhisperIcon className="!h-5 !w-5" />
                  Modo sussurro
                </Button>
              ) : null}
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
            </div>
          </AlertDescription>
        </Alert>
      ) : supportedModes.length === 0 && !isInternalNoteMode ? (
        <Alert>
          <AlertTitle>Nenhum modo compatível</AlertTitle>
          <AlertDescription>
            O canal não informou suporte a texto, mídia ou template para este atendimento.
          </AlertDescription>
        </Alert>
      ) : isRecordingAudio && mode === "TEXT" && !isInternalNoteMode ? (
        <AudioRecorder
          onSend={(audioBlob) => void handleSendAudio(audioBlob)}
          onCancel={() => setIsRecordingAudio(false)}
        />
      ) : (
        <Form {...form}>
          <form
            id="operational-template-form"
            onSubmit={form.handleSubmit(submit)}
            className={
              mode === "TEMPLATE" && templateCollapsed
                ? "hidden"
                : mode === "TEMPLATE"
                ? "flex min-h-0 flex-1 flex-col gap-3"
                : embedded
                  ? "space-y-2"
                  : "space-y-4"
            }
          >
            {isInternalNoteMode ? (
              <Alert className="border-primary/25 bg-primary/5">
                <LockKeyhole className="h-4 w-4 text-primary" />
                <AlertTitle>Modo sussurro ativo</AlertTitle>
                <AlertDescription>
                  Esta nota fica visível somente para a equipe interna.
                </AlertDescription>
              </Alert>
            ) : null}
            {mode === "TEXT" ? (
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="sr-only">
                      {isInternalNoteMode ? "Nota interna" : "Mensagem"}
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      {canUseInternalNote ? (
                        <Button
                          type="button"
                          variant={isInternalNoteMode ? "secondary" : "ghost"}
                          size="icon"
                          className={
                            isInternalNoteMode
                              ? "shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
                              : "shrink-0"
                          }
                          onClick={() => setIsInternalNoteMode((current) => !current)}
                          disabled={mutations.createInternalNote.isPending}
                          aria-label={
                            isInternalNoteMode
                              ? "Desativar modo sussurro"
                              : "Ativar modo sussurro"
                          }
                          aria-pressed={isInternalNoteMode}
                          title={
                            isInternalNoteMode
                              ? "Desativar modo sussurro"
                              : "Ativar modo sussurro"
                          }
                        >
                          <WhisperIcon className="!h-6 !w-6" />
                        </Button>
                      ) : null}
                      {!isInternalNoteMode && canUseOptionalTemplate ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => setMode("TEMPLATE")}
                          aria-label="Usar template"
                        >
                          <FileText className="h-5 w-5" />
                        </Button>
                      ) : null}
                      {!isInternalNoteMode && supportedModes.includes("MEDIA") ? (
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
                            disabled={mutations.createInternalNote.isPending}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={mutations.createInternalNote.isPending}
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
                          placeholder={
                            isInternalNoteMode
                              ? "Digite uma nota visível somente para a equipe"
                              : "Digite uma mensagem"
                          }
                          disabled={mutations.createInternalNote.isPending}
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
                      {isInternalNoteMode || field.value.trim() ? (
                        <Button
                          type="submit"
                          size="icon"
                          className="shrink-0"
                          disabled={
                            mutations.createInternalNote.isPending ||
                            (isInternalNoteMode && !field.value.trim())
                          }
                          aria-label={
                            isInternalNoteMode
                              ? "Salvar nota interna"
                              : "Enviar mensagem"
                          }
                        >
                          {mutations.createInternalNote.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      ) : !isInternalNoteMode && supportedModes.includes("MEDIA") ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => setIsRecordingAudio(true)}
                          disabled={mutations.createInternalNote.isPending}
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
                      disabled={mutations.createInternalNote.isPending}
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
                        disabled={mutations.createInternalNote.isPending}
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
                      disabled={mutations.createInternalNote.isPending}
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
                          disabled={mutations.createInternalNote.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            {mode === "TEMPLATE" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-md border bg-muted/10 p-4">
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
                {templateCatalogQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando templates aprovados...
                  </div>
                ) : templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Atualize a lista depois de sincronizar um template aprovado.
                  </p>
                ) : (
                  <>
                    <div className="shrink-0 space-y-2">
                      <Label htmlFor="operational-template">Template aprovado</Label>
                      <select
                        id="operational-template"
                        value={selectedTemplate?.id ?? ""}
                        onChange={(event) => setSelectedTemplateId(event.target.value)}
                        disabled={mutations.createInternalNote.isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} · {template.language}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid min-h-0 gap-4 overflow-y-auto overscroll-contain [@container(min-width:40rem)]:grid-cols-2 [@container(min-width:40rem)]:overflow-hidden">
                      <section
                        aria-label="Parâmetros do template"
                        tabIndex={0}
                        className="min-w-0 space-y-3 [@container(min-width:40rem)]:overflow-y-auto [@container(min-width:40rem)]:overscroll-contain [@container(min-width:40rem)]:pr-2"
                      >
                        {templateSlots.length ? (
                          <>
                            <p className="text-sm font-medium">Parâmetros</p>
                            {templateSlots.map((slot) => {
                              const binding = templateBindings[slot];
                              return (
                                <div key={slot} className="grid gap-2 [@container(min-width:56rem)]:grid-cols-[9rem_minmax(0,1fr)]">
                                  <div className="space-y-2">
                                    <Label htmlFor={`binding-source-${slot}`}>{slot}</Label>
                                    <select
                                      id={`binding-source-${slot}`}
                                      value={getBindingSelectorValue(binding)}
                                      onChange={(event) => updateBinding(slot, event.target.value)}
                                      disabled={mutations.createInternalNote.isPending}
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
                                        disabled={mutations.createInternalNote.isPending}
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
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Este template não possui parâmetros variáveis.
                          </p>
                        )}
                      </section>
                      {templatePreview ? (
                        <section
                          aria-label="Pré-visualização da mensagem"
                          tabIndex={0}
                          className="min-w-0 space-y-2 rounded-md border bg-background p-3 [@container(min-width:40rem)]:overflow-y-auto [@container(min-width:40rem)]:overscroll-contain"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Pré-visualização
                          </p>
                          <TemplateMessage
                            snapshot={templatePreview}
                            fallbackBody="Este template não possui conteúdo textual."
                          />
                        </section>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {mode !== "TEXT" ? (
              <div className="flex shrink-0 justify-end gap-3">
                <Button
                  type="submit"
                  disabled={mutations.createInternalNote.isPending}
                >
                  {mutations.createInternalNote.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {mutations.createInternalNote.isPending
                    ? "Salvando..."
                    : "Enviar"}
                </Button>
              </div>
            ) : null}
          </form>
        </Form>
      )}

    </div>
  );
}
