import React, { useState, useEffect } from "react";
import { X, Send, FileText, Music, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MediaPreviewModalProps {
  open: boolean;
  onClose: () => void;
  file: File | null;
  onSend: (caption?: string) => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  open,
  onClose,
  file,
  onSend,
}) => {
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    // Create preview URL for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleSend = () => {
    onSend(caption || undefined);
    setCaption("");
  };

  const getFileIcon = () => {
    if (!file) return null;

    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-12 w-12 text-blue-500" />;
    }
    if (file.type.startsWith("audio/")) {
      return <Music className="h-12 w-12 text-green-500" />;
    }
    return <FileText className="h-12 w-12 text-orange-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMediaType = () => {
    if (!file) return "";
    if (file.type.startsWith("image/")) return "Imagem";
    if (file.type.startsWith("audio/")) return "Áudio";
    return "Documento";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar {getMediaType()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Area */}
          <div className="flex items-center justify-center bg-muted rounded-lg p-8 min-h-[300px]">
            {file?.type.startsWith("image/") && previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[400px] rounded-lg object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                {getFileIcon()}
                <div className="text-center">
                  <p className="font-medium text-lg">{file?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {file && formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Caption Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Legenda {file?.type.startsWith("image/") ? "(opcional)" : ""}
            </label>
            <Textarea
              placeholder="Adicione uma legenda..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleSend();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Pressione Ctrl+Enter para enviar
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
