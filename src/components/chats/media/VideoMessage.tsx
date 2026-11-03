import React from "react";

interface VideoMessageProps {
  url: string;
  caption?: string;
}

export const VideoMessage: React.FC<VideoMessageProps> = ({ url, caption }) => (
  <div className="flex max-w-full flex-col gap-2">
    <video
      aria-label={caption || "Vídeo"}
      className="max-h-[400px] max-w-full rounded-lg bg-black"
      controls
      playsInline
      preload="metadata"
      src={url}
    >
      Seu navegador não oferece suporte à reprodução de vídeo.
    </video>
    {caption ? (
      <p className="whitespace-pre-wrap break-words text-sm">{caption}</p>
    ) : null}
  </div>
);
