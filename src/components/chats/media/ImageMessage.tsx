import React, { useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageMessageProps {
  url: string;
  caption?: string;
  mimetype?: string;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  url,
  caption,
  mimetype,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `image-${Date.now()}.${mimetype?.split("/")[1] || "jpg"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">Failed to load image</p>
        <Button
          variant="link"
          size="sm"
          onClick={() => window.open(url, "_blank")}
          className="mt-2"
        >
          Open in new tab
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative group">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <img
          src={url}
          alt={caption || "Image"}
          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxHeight: "400px", objectFit: "contain" }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onClick={() => setIsOpen(true)}
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
        {caption && (
          <p className="text-sm mt-2 whitespace-pre-wrap break-words">
            {caption}
          </p>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img
              src={url}
              alt={caption || "Image"}
              className="w-full h-auto rounded-lg"
            />
            {caption && (
              <p className="text-sm mt-4 text-muted-foreground">{caption}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
