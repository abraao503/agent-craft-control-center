import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Paperclip,
  X,
  Image,
  FileAudio,
  FileText,
  AlertCircle,
  Download,
} from "lucide-react";
import {
  validateFollowUpFile,
  getMediaTypeFromFile,
  FOLLOW_UP_ACCEPT_STRING,
  FOLLOW_UP_MAX_FILE_SIZE,
} from "./followUpUtils";

interface MediaAttachmentProps {
  file: File | null;
  onChange: (file: File | null) => void;
  /** URL de mídia existente (para edição) */
  existingMediaUrl?: string | null;
  existingMediaType?: "image" | "audio" | "document" | null;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMediaIcon(type: "image" | "audio" | "document") {
  switch (type) {
    case "image":
      return <Image className="h-5 w-5 text-blue-500" />;
    case "audio":
      return <FileAudio className="h-5 w-5 text-purple-500" />;
    case "document":
      return <FileText className="h-5 w-5 text-orange-500" />;
  }
}

function getMediaLabel(type: "image" | "audio" | "document") {
  switch (type) {
    case "image":
      return "Imagem";
    case "audio":
      return "Áudio";
    case "document":
      return "Documento";
  }
}

export function MediaAttachment({
  file,
  onChange,
  existingMediaUrl,
  existingMediaType,
  disabled = false,
}: MediaAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [removedExisting, setRemovedExisting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    const validation = validateFollowUpFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    onChange(selectedFile);
    setRemovedExisting(true);

    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
    setRemovedExisting(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasExistingMedia =
    existingMediaUrl && existingMediaType && !removedExisting && !file;

  return (
    <div className="space-y-2">
      <Label>Mídia (opcional)</Label>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={FOLLOW_UP_ACCEPT_STRING}
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {/* Exibindo mídia existente */}
      {hasExistingMedia && (
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
          {/* Thumbnail quadrado para imagem; ícone para outros tipos */}
          {existingMediaType === "image" ? (
            <img
              src={existingMediaUrl!}
              alt="Imagem anexada"
              className="h-12 w-12 rounded object-cover shrink-0 cursor-pointer"
              onClick={() => setImagePreviewUrl(existingMediaUrl!)}
            />
          ) : (
            getMediaIcon(existingMediaType!)
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {getMediaLabel(existingMediaType!)} anexado
            </p>
            {/* Download para áudio / documento */}
            {existingMediaType !== "image" ? (
              <a
                href={existingMediaUrl!}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Download className="h-3 w-3 shrink-0" />
                Baixar arquivo
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">Mídia existente</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Substituir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Exibindo arquivo selecionado */}
      {file && (
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
          {getMediaIcon(getMediaTypeFromFile(file))}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {getMediaLabel(getMediaTypeFromFile(file))} ·{" "}
              {formatFileSize(file.size)}
            </p>
          </div>
          {/* Preview para imagem */}
          {file.type.startsWith("image/") && (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="h-10 w-10 rounded object-cover cursor-pointer"
              onClick={() => setImagePreviewUrl(URL.createObjectURL(file))}
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Botão de upload quando não há arquivo */}
      {!file && !hasExistingMedia && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Anexar arquivo
        </Button>
      )}

      {/* Erro de validação */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dica de formatos */}
      {!file && !hasExistingMedia && (
        <p className="text-xs text-muted-foreground">
          Imagens, áudios ou documentos (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX,
          TXT, CSV). Máx. {FOLLOW_UP_MAX_FILE_SIZE / (1024 * 1024)} MB.
        </p>
      )}

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
}
