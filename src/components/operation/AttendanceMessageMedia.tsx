import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AttendanceMessageItem } from '@/types/operation-attendance';
import { ImageMessage } from '@/components/chats/media/ImageMessage';
import { AudioMessage } from '@/components/chats/media/AudioMessage';
import { DocumentMessage } from '@/components/chats/media/DocumentMessage';
import { VideoMessage } from '@/components/chats/media/VideoMessage';
import { getOperationalAttendanceMessageMedia } from '@/services/operation/getOperationalAttendanceMessageMedia';
import { AudioTranscription } from '@/components/operation/AudioTranscription';

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
    setHasError(false);
    if (message.type === 'document') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

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
  }, [attendanceId, message.id, message.type, workspaceId]);

  if (message.type === 'document') {
    return (
      <DocumentMessage
        url=""
        filename={message.content || undefined}
        mimetype={message.mediaMimetype || undefined}
        loadDocument={async () => {
          if (!workspaceId || !attendanceId) {
            throw new Error('Atendimento indisponível para baixar o documento.');
          }
          return getOperationalAttendanceMessageMedia({
            workspaceId,
            attendanceId,
            messageId: message.id,
          });
        }}
      />
    );
  }

  // Audio keeps its player in place while the file loads, so the type is
  // identifiable right away and the transcription does not wait for the media.
  if (message.type === 'audio') {
    return (
      <>
        <AudioMessage
          url={mediaUrl}
          fetchFailed={hasError || (!isLoading && !mediaUrl)}
          mimetype={message.mediaMimetype || undefined}
        />
        {message.transcription ? (
          <AudioTranscription
            workspaceId={workspaceId}
            attendanceId={attendanceId}
            messageId={message.id}
            transcription={message.transcription}
          />
        ) : null}
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-2" role="status" aria-label="Carregando mídia">
        <Loader2 className="h-4 w-4 animate-spin opacity-75" aria-hidden="true" />
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

  if (message.type === 'video') {
    return <VideoMessage url={mediaUrl} caption={message.content || undefined} />;
  }

  return null;
}
