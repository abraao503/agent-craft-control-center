import React, { useState, useRef, useEffect } from "react";
import { Trash2, Play, Pause, Send, Mic as MicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSend,
  onCancel,
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/ogg; codecs=opus" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record audio.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    setIsPaused(false);
    // Resume timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Wait for onstop to create blob, then send
      setTimeout(() => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/ogg; codecs=opus" });
          onSend(audioBlob);
        }
      }, 100);
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
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
    onCancel();
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    startRecording();
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
      {isRecording || isPaused ? (
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
