import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TagSelector } from "./TagSelector";
import { ReengagementConfig, ReengagementConfigInput } from "@/types/pipeline";
import {
  Plus,
  Settings2,
  CheckCircle2,
  Paperclip,
  X,
  Loader2,
  Image,
  FileAudio,
  FileText,
  AlertCircle,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { uploadMedia, UploadMediaResponse } from "@/services/file/uploadMedia";
import {
  validateFollowUpFile,
  getMediaTypeFromFile,
  FOLLOW_UP_ACCEPT_STRING,
  FOLLOW_UP_MAX_FILE_SIZE,
} from "../deals/follow-up/followUpUtils";

// Helper function to convert time string (HH:MM) to ISO datetime
const timeToISO = (timeString: string): string => {
  const now = new Date();
  const [hours, minutes] = timeString.split(":").map(Number);
  now.setHours(hours, minutes, 0, 0);
  return now.toISOString();
};

// Helper function to extract time (HH:MM) from ISO datetime
const isoToTime = (isoString: string): string => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

interface ReengagementConfigSectionProps {
  workspaceId: string;
  config: ReengagementConfig | null;
  onChange: (config: ReengagementConfigInput | null) => void;
  className?: string;
}

export function ReengagementConfigSection({
  workspaceId,
  config,
  onChange,
  className,
}: ReengagementConfigSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draftConfig, setDraftConfig] =
    useState<ReengagementConfigInput | null>(config);
  const [maxMessagesInput, setMaxMessagesInput] = useState<string>("");
  const [startTimeInput, setStartTimeInput] = useState<string>("08:00");
  const [endTimeInput, setEndTimeInput] = useState<string>("17:00");

  // Media upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Tracks the currently uploaded media for display purposes inside the modal
  const [uploadedMedia, setUploadedMedia] =
    useState<UploadMediaResponse | null>(null);
  // Local object URL for immediate preview before/during upload
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [localPreviewType, setLocalPreviewType] = useState<
    "image" | "audio" | "document" | null
  >(null);
  // Tracks when the user explicitly removes the server-side media inside the modal
  const [mediaRemoved, setMediaRemoved] = useState(false);
  // URL of image to show in the lightbox (null = closed)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Sync draft with prop changes (sempre que config muda)
  useEffect(() => {
    setDraftConfig(config);

    // Extract time from ISO if config exists
    if (config?.startTime) {
      setStartTimeInput(isoToTime(config.startTime));
    } else {
      setStartTimeInput("08:00");
    }

    if (config?.endTime) {
      setEndTimeInput(isoToTime(config.endTime));
    } else {
      setEndTimeInput("17:00");
    }
  }, [config]);

  // Sync maxMessagesInput with draftConfig when modal opens or config changes
  useEffect(() => {
    if (draftConfig) {
      setMaxMessagesInput(draftConfig.maxMessages.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftConfig?.maxMessages]);

  const isEnabled = !!config;

  // Default values
  const defaultConfig: ReengagementConfigInput = {
    minInactiveChatTimeHours: 24,
    maxMessages: 3,
    messages: [""],
    includeTags: [],
    excludeTags: [],
    isActive: true,
    startTime: timeToISO("08:00"),
    endTime: timeToISO("17:00"),
  };

  const handleOpenModal = () => {
    // If not enabled, set default config in draft
    if (!isEnabled) {
      setDraftConfig(defaultConfig);
      setStartTimeInput("08:00");
      setEndTimeInput("17:00");
      setUploadedMedia(null);
      setUploadError(null);
    } else {
      setUploadError(null);
    }
    setMediaRemoved(false);
    setUploadedMedia(null);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(null);
    setLocalPreviewType(null);
    // Se já tem config, os valores já foram sincronizados pelo useEffect
    setOpen(true);
  };

  const handleDisable = () => {
    setDraftConfig(null);
    onChange(null);
  };

  const handleSave = () => {
    if (!draftConfig) return;

    // Bloquear save durante upload
    if (isUploading) {
      toast({
        title: "Upload em andamento",
        description: "Aguarde o upload do arquivo terminar antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    // Validação: verificar se todas as mensagens estão preenchidas
    const emptyMessages = draftConfig.messages.filter(
      (m) => m.trim() === "",
    ).length;

    if (emptyMessages > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha todas as ${draftConfig.maxMessages} mensagens configuradas.`,
        variant: "destructive",
      });
      return;
    }

    // Validação: verificar se o número de mensagens corresponde ao máximo
    if (draftConfig.messages.length !== draftConfig.maxMessages) {
      toast({
        title: "Configuração inválida",
        description: `O número de mensagens (${draftConfig.messages.length}) não corresponde ao máximo configurado (${draftConfig.maxMessages}).`,
        variant: "destructive",
      });
      return;
    }

    // Validação: verificar horários de funcionamento
    const [startHour, startMin] = startTimeInput.split(":").map(Number);
    const [endHour, endMin] = endTimeInput.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      toast({
        title: "Horário inválido",
        description:
          "O horário de término deve ser maior que o horário de início.",
        variant: "destructive",
      });
      return;
    }

    // Converter horários para ISO antes de salvar
    const configToSave: ReengagementConfigInput = {
      ...draftConfig,
      startTime: timeToISO(startTimeInput),
      endTime: timeToISO(endTimeInput),
    };

    // Se passou todas as validações, salvar
    onChange(configToSave);
    setOpen(false);
  };

  const handleCancel = () => {
    setDraftConfig(config);
    setUploadError(null);
    setIsUploading(false);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(null);
    setLocalPreviewType(null);
    setUploadedMedia(null);
    setMediaRemoved(false);
    setOpen(false);
  };

  // --- Media helpers ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    setUploadError(null);

    const validation = validateFollowUpFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadedMedia(null);

    // Create local preview URL immediately for instant feedback
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);

    // Detect local media type from mime type
    const detectedType = getMediaTypeFromFile(file);
    setLocalPreviewType(detectedType);

    try {
      const result = await uploadMedia(file);
      setUploadedMedia(result);
      updateDraftConfig({ mediaFileId: result.id });
    } catch {
      setUploadError("Erro ao fazer upload do arquivo. Tente novamente.");
      // Keep local preview on error so user can see what failed
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    setUploadedMedia(null);
    setUploadError(null);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(null);
    setLocalPreviewType(null);
    setMediaRemoved(true);
    updateDraftConfig({ mediaFileId: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getMediaIcon = (type: "image" | "audio" | "document") => {
    if (type === "image") return <Image className="h-5 w-5 text-blue-500" />;
    if (type === "audio")
      return <FileAudio className="h-5 w-5 text-purple-500" />;
    return <FileText className="h-5 w-5 text-orange-500" />;
  };

  const getMediaLabel = (type: "image" | "audio" | "document") => {
    if (type === "image") return "Imagem";
    if (type === "audio") return "Áudio";
    return "Documento";
  };

  // Resolved media from the server (present when config was fetched from API)
  const existingMediaUrl = config?.mediaUrl ?? null;
  const existingMediaType = config?.mediaType ?? null;

  const updateDraftConfig = (updates: Partial<ReengagementConfigInput>) => {
    if (!draftConfig) return;
    setDraftConfig({ ...draftConfig, ...updates });
  };

  const updateMessage = (index: number, value: string) => {
    if (!draftConfig) return;
    const newMessages = [...draftConfig.messages];
    newMessages[index] = value;
    updateDraftConfig({ messages: newMessages });
  };

  // Render the configuration modal content
  const renderModalContent = () => {
    if (!draftConfig) return null;

    return (
      <div className="space-y-4 py-4">
        {/* Inactive Time */}
        <div className="space-y-2">
          <Label htmlFor="minInactiveChatTimeHours">
            Tempo de inatividade (horas)
          </Label>
          <Input
            id="minInactiveChatTimeHours"
            type="number"
            min={1}
            value={draftConfig.minInactiveChatTimeHours}
            onChange={(e) =>
              updateDraftConfig({
                minInactiveChatTimeHours: Math.max(
                  1,
                  parseInt(e.target.value) || 1,
                ),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Quanto tempo o chat precisa estar inativo antes de enviar a primeira
            mensagem
          </p>
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Início do expediente</Label>
            <Input
              id="startTime"
              type="time"
              value={startTimeInput}
              onChange={(e) => setStartTimeInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Horário de início</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Fim do expediente</Label>
            <Input
              id="endTime"
              type="time"
              value={endTimeInput}
              onChange={(e) => setEndTimeInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Horário de término</p>
          </div>
        </div>

        {/* Max Messages */}
        <div className="space-y-2">
          <Label htmlFor="maxMessages">Máximo de mensagens</Label>
          <Input
            id="maxMessages"
            type="number"
            min={1}
            max={10}
            value={maxMessagesInput}
            onChange={(e) => {
              const inputValue = e.target.value;
              setMaxMessagesInput(inputValue);

              // Allow empty field temporarily
              if (inputValue === "") {
                return;
              }

              const value = parseInt(inputValue);
              if (isNaN(value)) return;

              const newMax = Math.min(10, Math.max(1, value));
              const currentMessages = draftConfig.messages;

              // Adjust messages array to match the new max
              let newMessages = [...currentMessages];
              if (newMax > currentMessages.length) {
                // Add empty messages to reach the max
                newMessages = [
                  ...currentMessages,
                  ...Array(newMax - currentMessages.length).fill(""),
                ];
              } else if (newMax < currentMessages.length) {
                // Remove excess messages
                newMessages = currentMessages.slice(0, newMax);
              }

              updateDraftConfig({
                maxMessages: newMax,
                messages: newMessages,
              });
            }}
            onBlur={() => {
              // If empty on blur, set to 1
              if (maxMessagesInput === "") {
                setMaxMessagesInput("1");
                updateDraftConfig({
                  maxMessages: 1,
                  messages: [""],
                });
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Quantidade de mensagens que serão enviadas (máximo 10). Configure
            exatamente {draftConfig.maxMessages} mensagem(ns) abaixo.
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Mensagens de Follow-up ({draftConfig.messages.length}/
              {draftConfig.maxMessages})
            </Label>
          </div>

          <div className="space-y-3">
            {draftConfig.messages.map((message, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Mensagem {index + 1}
                  </Label>
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => updateMessage(index, e.target.value)}
                  placeholder={`Digite a mensagem ${index + 1}...`}
                  className="min-h-[80px] resize-none"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            As mensagens serão enviadas de forma aleatória a cada tentativa de
            follow-up
          </p>
        </div>

        {/* Media Upload */}
        <div className="space-y-2">
          <Label>Mídia (opcional)</Label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={FOLLOW_UP_ACCEPT_STRING}
            onChange={handleFileSelect}
            disabled={isUploading}
          />

          {/* Uploading indicator — show local preview while upload is in progress */}
          {isUploading && (
            <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
              {localPreviewType === "image" && localPreviewUrl ? (
                <img
                  src={localPreviewUrl}
                  alt="Preview"
                  className="h-12 w-12 rounded object-cover shrink-0 cursor-pointer"
                  onClick={() => setImagePreviewUrl(localPreviewUrl)}
                />
              ) : localPreviewType ? (
                getMediaIcon(localPreviewType)
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {localPreviewType
                    ? getMediaLabel(localPreviewType)
                    : "Arquivo"}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  <span>Fazendo upload…</span>
                </div>
              </div>
            </div>
          )}

          {/* Newly uploaded media preview */}
          {!isUploading && uploadedMedia && (
            <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
              {uploadedMedia.mediaType === "image" ? (
                <img
                  src={uploadedMedia.url}
                  alt={uploadedMedia.name}
                  className="h-12 w-12 rounded object-cover shrink-0 cursor-pointer"
                  onClick={() => setImagePreviewUrl(uploadedMedia.url)}
                />
              ) : (
                getMediaIcon(uploadedMedia.mediaType)
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {uploadedMedia.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getMediaLabel(uploadedMedia.mediaType)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Substituir
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleRemoveMedia}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Existing server-side media (visible unless user removed it or replaced with a new upload) */}
          {!isUploading &&
            !uploadedMedia &&
            !mediaRemoved &&
            existingMediaUrl &&
            existingMediaType && (
              <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                {existingMediaType === "image" ? (
                  <img
                    src={existingMediaUrl}
                    alt="Imagem anexada"
                    className="h-12 w-12 rounded object-cover shrink-0 cursor-pointer"
                    onClick={() => setImagePreviewUrl(existingMediaUrl)}
                  />
                ) : (
                  getMediaIcon(existingMediaType)
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getMediaLabel(existingMediaType)} anexado
                  </p>
                  {existingMediaType !== "image" ? (
                    <a
                      href={existingMediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="h-3 w-3 shrink-0" />
                      Baixar arquivo
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Mídia existente
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Substituir
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleRemoveMedia}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

          {/* Upload button — show when there's no media at all */}
          {!isUploading &&
            !uploadedMedia &&
            !(existingMediaUrl && !mediaRemoved) && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Anexar arquivo
              </Button>
            )}

          {/* Upload error */}
          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Hint text */}
          {!isUploading &&
            !uploadedMedia &&
            !(existingMediaUrl && !mediaRemoved) && (
              <p className="text-xs text-muted-foreground">
                Imagens, áudios ou documentos (PDF, DOC, DOCX, XLS, XLSX, PPT,
                PPTX, TXT, CSV). Máx. {FOLLOW_UP_MAX_FILE_SIZE / (1024 * 1024)}{" "}
                MB.
              </p>
            )}
        </div>

        {/* Include Tags */}
        <div className="space-y-2">
          <TagSelector
            workspaceId={workspaceId}
            selectedTagIds={draftConfig.includeTags || []}
            onSelectionChange={(tagIds) =>
              updateDraftConfig({ includeTags: tagIds })
            }
            label="Tags enviar mensagens"
            placeholder="Adicionar tags"
            emptyMessage="Todos os negócios serão incluídos (nenhum filtro)"
          />
          <p className="text-xs text-muted-foreground">
            Se vazio, todos os negócios inativos serão considerados. Se
            preenchido, apenas negócios com pelo menos uma dessas tags serão
            incluídos.
          </p>
        </div>

        {/* Exclude Tags */}
        <div className="space-y-2">
          <TagSelector
            workspaceId={workspaceId}
            selectedTagIds={draftConfig.excludeTags || []}
            onSelectionChange={(tagIds) =>
              updateDraftConfig({ excludeTags: tagIds })
            }
            label="Tags bloquear mensagens"
            placeholder="Adicionar tags"
            emptyMessage="Nenhum negócio será excluído"
          />
          <p className="text-xs text-muted-foreground">
            negócios com qualquer uma dessas tags NÃO receberão mensagens de
            follow-up.
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Status da Configuração
            </Label>
            <p className="text-xs text-muted-foreground">
              Ativar ou desativar o follow-up sem perder as configurações
            </p>
          </div>
          <Switch
            checked={draftConfig.isActive ?? true}
            onCheckedChange={(checked) =>
              updateDraftConfig({ isActive: checked })
            }
          />
        </div>

        {/* Image lightbox */}
        <Dialog
          open={!!imagePreviewUrl}
          onOpenChange={(open) => !open && setImagePreviewUrl(null)}
        >
          <DialogContent className="max-w-4xl p-2 bg-black/90 border-0">
            <img
              src={imagePreviewUrl ?? ""}
              alt="Prévia da imagem"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Follow-up Automático</Label>
            {isEnabled && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-700 border-green-200"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isEnabled ? "Ativo" : "Desativado"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenModal}
              className={cn(!isEnabled && "w-full")}
            >
              {isEnabled ? (
                <>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configurar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ativar Follow-up
                </>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configuração de Follow-up</DialogTitle>
              <DialogDescription>
                Configure mensagens automáticas para negócios inativos nesta
                etapa
              </DialogDescription>
            </DialogHeader>

            {renderModalContent()}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={isUploading}>
                {isUploading && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Salvar Configurações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isEnabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDisable}
            className="text-destructive hover:text-destructive"
          >
            Desativar
          </Button>
        )}
      </div>

      {/* Summary when configured */}
      {isEnabled && config && (
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>• {config.minInactiveChatTimeHours}h de inatividade</p>
          <p>• {config.maxMessages} mensagem(ns) máxima(s)</p>
          {config.startTime && config.endTime && (
            <p>
              • Horário: {isoToTime(config.startTime)} às{" "}
              {isoToTime(config.endTime)}
            </p>
          )}
          {(config.mediaFileId || existingMediaUrl) && (
            <p>
              • Mídia{" "}
              {existingMediaType ? getMediaLabel(existingMediaType) : "anexada"}
            </p>
          )}
          {config.includeTags && config.includeTags.length > 0 && (
            <p>• {config.includeTags.length} tag(s) para incluir</p>
          )}
          {config.excludeTags && config.excludeTags.length > 0 && (
            <p>• {config.excludeTags.length} tag(s) para excluir</p>
          )}
        </div>
      )}
    </div>
  );
}
