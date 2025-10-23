import React from "react";
import { Download, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentMessageProps {
  url: string;
  filename?: string;
  mimetype?: string;
}

export const DocumentMessage: React.FC<DocumentMessageProps> = ({
  url,
  filename,
  mimetype,
}) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename || `document-${Date.now()}.${getExtension()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const getExtension = () => {
    if (filename && filename.includes(".")) {
      return filename.split(".").pop() || "pdf";
    }
    if (mimetype) {
      const ext = mimetype.split("/")[1];
      return ext || "pdf";
    }
    return "pdf";
  };

  const getFileIcon = () => {
    if (mimetype?.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    if (
      mimetype?.includes("word") ||
      mimetype?.includes("document") ||
      filename?.endsWith(".doc") ||
      filename?.endsWith(".docx")
    ) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }
    if (
      mimetype?.includes("excel") ||
      mimetype?.includes("spreadsheet") ||
      filename?.endsWith(".xls") ||
      filename?.endsWith(".xlsx")
    ) {
      return <FileText className="h-8 w-8 text-green-500" />;
    }
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const displayName = filename || "Document";
  const extension = getExtension().toUpperCase();

  return (
    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg min-w-[280px] max-w-[400px] border border-border/50">
      <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
        {getFileIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground">{extension}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        className="flex-shrink-0"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
