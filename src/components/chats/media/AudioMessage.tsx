import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioMessageProps {
  url: string;
  mimetype?: string;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({
  url,
  mimetype,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (hasError) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg min-w-[250px]">
        <p className="text-sm text-muted-foreground flex-1">
          Failed to load audio
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg min-w-[250px] max-w-[320px]">
      <audio ref={audioRef} src={url} preload="metadata" />

      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        disabled={isLoading}
        className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary p-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 ml-0.5 fill-current" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-2">
        {/* Progress Bar */}
        <div 
          className="flex-1 h-1 bg-muted rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleWaveformClick}
        >
          <div 
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time */}
        <span className="text-xs text-muted-foreground font-normal min-w-[35px] text-right">
          {formatTime(isPlaying ? currentTime : duration)}
        </span>
      </div>
    </div>
  );
};
