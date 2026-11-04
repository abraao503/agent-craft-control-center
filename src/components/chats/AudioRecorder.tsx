import React, { useState, useRef, useEffect } from "react";
import { Trash2, Play, Pause, Send, Loader2, Mic as MicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  createOggOpusRecorder,
  isOggOpusRecording,
  OGG_OPUS_MIME_TYPE,
} from "./media/create-ogg-opus-recorder";

interface AudioRecorderProps {
  onSend: (audioBlob: Blob, optimisticId?: string) => void;
  onSendStart?: (optimisticId: string, durationSeconds: number) => void;
  onSendError?: (optimisticId: string) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSend,
  onSendStart,
  onSendError,
  onCancel,
}) => {
  const { toast } = useToast();
  const [isPreparing, setIsPreparing] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingMimeTypeRef = useRef(OGG_OPUS_MIME_TYPE);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const onSendRef = useRef(onSend);
  const onSendStartRef = useRef(onSendStart);
  const onSendErrorRef = useRef(onSendError);
  const optimisticSendIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(false);
  const recordingAttemptRef = useRef(0);
  const sendWhenStoppedRef = useRef(false);
  const discardWhenStoppedRef = useRef(false);
  const recordingFailedRef = useRef(false);

  onSendRef.current = onSend;
  onSendStartRef.current = onSendStart;
  onSendErrorRef.current = onSendError;

  const reportSendError = () => {
    const optimisticId = optimisticSendIdRef.current;
    optimisticSendIdRef.current = null;
    if (optimisticId) onSendErrorRef.current?.(optimisticId);
  };

  const replaceAudioUrl = (url: string | null) => {
    if (audioUrlRef.current && audioUrlRef.current !== url) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    audioUrlRef.current = url;
    setAudioUrl(url);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopMediaStream = (stream = mediaStreamRef.current) => {
    stream?.getTracks().forEach((track) => track.stop());

    if (mediaStreamRef.current === stream) {
      mediaStreamRef.current = null;
    }
  };

  const showRecordingError = () => {
    toast({
      title: "Não foi possível preparar o áudio",
      description: "Tente gravar novamente.",
      variant: "destructive",
    });
  };

  const startRecording = async () => {
    setIsPreparing(true);
    const attempt = ++recordingAttemptRef.current;
    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: { exact: 1 } },
      });

      if (!isMountedRef.current || recordingAttemptRef.current !== attempt) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const { recorder: mediaRecorder, mimeType } = await createOggOpusRecorder(
        stream,
      );
      recorder = mediaRecorder;

      if (!isMountedRef.current || recordingAttemptRef.current !== attempt) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      recordingMimeTypeRef.current = mimeType;
      audioChunksRef.current = [];
      sendWhenStoppedRef.current = false;
      discardWhenStoppedRef.current = false;
      recordingFailedRef.current = false;
      setRecordingTime(0);
      setAudioBlob(null);
      replaceAudioUrl(null);
      setIsPlaying(false);

      mediaRecorder.onstart = () => {
        if (!isMountedRef.current || recordingAttemptRef.current !== attempt) {
          return;
        }
        setIsPreparing(false);
        setIsRecording(true);
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopTimer();
        stopMediaStream(stream);
        mediaRecorderRef.current = null;

        const shouldSend = sendWhenStoppedRef.current;
        const shouldDiscard = discardWhenStoppedRef.current;
        const recordingFailed = recordingFailedRef.current;
        sendWhenStoppedRef.current = false;
        discardWhenStoppedRef.current = false;
        recordingFailedRef.current = false;

        const completedAudio = new Blob(audioChunksRef.current, {
          type: recordingMimeTypeRef.current,
        });
        audioChunksRef.current = [];

        if (!isMountedRef.current) {
          return;
        }

        setIsRecording(false);
        setIsPaused(false);

        if (shouldDiscard || recordingFailed) {
          return;
        }

        let validRecording = false;
        try {
          validRecording = await isOggOpusRecording(completedAudio);
        } catch {
          // An unreadable recording is rejected before it reaches the send queue.
        }
        if (!isMountedRef.current || recordingAttemptRef.current !== attempt) {
          return;
        }

        if (!validRecording) {
          reportSendError();
          showRecordingError();
          onCancel();
          return;
        }

        if (shouldSend) {
          const optimisticId = optimisticSendIdRef.current ?? undefined;
          optimisticSendIdRef.current = null;
          onSendRef.current(completedAudio, optimisticId);
          return;
        }

        setAudioBlob(completedAudio);
        replaceAudioUrl(URL.createObjectURL(completedAudio));
      };

      mediaRecorder.onerror = () => {
        reportSendError();
        recordingFailedRef.current = true;
        discardWhenStoppedRef.current = true;
        sendWhenStoppedRef.current = false;
        stopTimer();

        if (mediaRecorder.state !== "inactive") {
          try {
            mediaRecorder.stop();
          } catch {
            // The stream is stopped below even if the encoder already stopped.
          }
        }

        stopMediaStream(stream);

        if (isMountedRef.current) {
          setIsRecording(false);
          setIsPaused(false);
          showRecordingError();
          onCancel();
        }
      };

      mediaRecorder.start();
    } catch {
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;

        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            // The failed recording is cleaned up below.
          }
        }
      }

      stream?.getTracks().forEach((track) => track.stop());
      if (mediaStreamRef.current === stream) {
        mediaStreamRef.current = null;
      }
      if (mediaRecorderRef.current === recorder) {
        mediaRecorderRef.current = null;
      }

      if (!isMountedRef.current || recordingAttemptRef.current !== attempt) {
        return;
      }

      setIsRecording(false);
      setIsPaused(false);
      showRecordingError();
      onCancel();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state !== "recording") {
      return;
    }

    mediaRecorderRef.current.pause();
    setIsPaused(true);
    stopTimer();
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state !== "paused") {
      return;
    }

    mediaRecorderRef.current.resume();
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecordingAndSend = () => {
    const mediaRecorder = mediaRecorderRef.current;

    if (
      !mediaRecorder ||
      mediaRecorder.state === "inactive" ||
      sendWhenStoppedRef.current
    ) {
      return;
    }

    sendWhenStoppedRef.current = true;
    const optimisticId = crypto.randomUUID();
    optimisticSendIdRef.current = optimisticId;
    onSendStartRef.current?.(optimisticId, recordingTime);
    stopTimer();

    try {
      mediaRecorder.stop();
    } catch {
      reportSendError();
      sendWhenStoppedRef.current = false;
      discardWhenStoppedRef.current = true;
      recordingFailedRef.current = true;
      stopMediaStream();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setIsPaused(false);
      showRecordingError();
      onCancel();
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    reportSendError();
    discardWhenStoppedRef.current = true;
    sendWhenStoppedRef.current = false;

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        mediaRecorder.stop();
      } catch {
        // The recording is discarded even if the encoder already stopped.
      }
    }

    recordingAttemptRef.current += 1;
    stopTimer();
    stopMediaStream();
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setAudioBlob(null);
    replaceAudioUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    onCancel();
  };

  const handleSend = () => {
    if (!audioBlob || audioBlob.size === 0) {
      showRecordingError();
      return;
    }

    onSend(audioBlob);
    setAudioBlob(null);
    replaceAudioUrl(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    isMountedRef.current = true;
    void startRecording();

    return () => {
      isMountedRef.current = false;
      recordingAttemptRef.current += 1;
      stopTimer();

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current?.stop();
        } catch {
          // The component is unmounting; the stream is stopped below.
        }
      }

      stopMediaStream();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  }, [audioUrl]);

  return (
    <div className="flex items-center justify-end gap-2 bg-background px-3 py-2">
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}

      {/* Recording state */}
      {isPreparing ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparando gravador…
          <Button variant="ghost" size="icon" aria-label="Cancelar gravação" onClick={deleteRecording}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : isRecording || isPaused ? (
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Descartar áudio"
            onClick={deleteRecording}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Recording indicator */}
          {!isPaused && (
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}

          {/* Timer */}
          <span className="text-sm font-medium min-w-[40px]">
            {formatTime(recordingTime)}
          </span>

          {/* Waveform placeholder */}
          <div className="w-[200px] h-10 rounded bg-muted/30" />

          {/* Pause/Resume button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={isPaused ? "Retomar gravação" : "Pausar gravação"}
            onClick={isPaused ? resumeRecording : pauseRecording}
            className="h-8 w-8 hover:bg-background"
          >
            {isPaused ? (
              <MicIcon className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>

          {/* Send button */}
          <Button
            size="icon"
            aria-label="Enviar áudio"
            onClick={stopRecordingAndSend}
            className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : audioUrl ? (
        /* Preview state */
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={deleteRecording}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Play/Pause button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={isPlaying ? pauseAudio : playAudio}
            className="h-8 w-8 hover:bg-background"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {/* Progress bar */}
          <div className="flex-1 h-1 bg-background rounded-full min-w-[100px]">
            <div className="h-full bg-primary rounded-full w-0" />
          </div>

          {/* Timer */}
          <span className="text-xs text-muted-foreground min-w-[35px]">
            {formatTime(recordingTime)}
          </span>

          {/* Continue recording button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={startRecording}
            className="h-8 w-8 hover:bg-background"
          >
            <MicIcon className="h-4 w-4" />
          </Button>

          {/* Send button */}
          <Button
            size="icon"
            aria-label="Enviar áudio"
            onClick={handleSend}
            className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
};
