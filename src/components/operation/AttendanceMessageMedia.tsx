import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AttendanceMessageItem } from '@/types/operation-attendance';
import { ImageMessage } from '@/components/chats/media/ImageMessage';
import { AudioMessage } from '@/components/chats/media/AudioMessage';
import { DocumentMessage } from '@/components/chats/media/DocumentMessage';
import { getOperationalAttendanceMessageMedia } from '@/services/operation/getOperationalAttendanceMessageMedia';

type AttendanceMessageMediaProps = {
  workspaceId?: string;
  attendanceId?: string;
  message: AttendanceMessageItem;
};

export function AttendanceMessageMedia({
  workspaceId,
  attendanceId,
  message,
}: AttendanceMessageMediaProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    setMediaUrl(null);
    setIsLoading(true);
    setHasError(false);

    if (!workspaceId || !attendanceId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    void getOperationalAttendanceMessageMedia({
      workspaceId,
      attendanceId,
      messageId: message.id,
    })
      .then((media) => {
        const nextObjectUrl = URL.createObjectURL(media);
        if (isCancelled) {
          URL.revokeObjectURL(nextObjectUrl);
          return;
        }

        objectUrl = nextObjectUrl;
        setMediaUrl(nextObjectUrl);
      })
      .catch(() => {
        if (!isCancelled) setHasError(true);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attendanceId, message.id, workspaceId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm opacity-75">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Carregando mídia…</span>
      </div>
    );
  }

  if (hasError || !mediaUrl) {
    return <p className="py-2 text-sm opacity-75">Não foi possível carregar esta mídia.</p>;
  }

  if (message.type === 'image') {
    return (
      <ImageMessage
        url={mediaUrl}
        caption={message.content || undefined}
        mimetype={message.mediaMimetype || undefined}
      />
    );
  }

  if (message.type === 'audio') {
    return (
      <AudioMessage
        url={mediaUrl}
        mimetype={message.mediaMimetype || undefined}
      />
    );
  }

  if (message.type === 'document') {
    return (
      <DocumentMessage
        url={mediaUrl}
        filename={message.content || undefined}
        mimetype={message.mediaMimetype || undefined}
      />
    );
  }

  return null;
}
