import React, { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioMessageProps {
  url: string;
  mimetype?: string;
}

const waveform = [
  12, 18, 10, 23, 15, 28, 20, 13, 25, 17, 30, 14, 21, 11, 26, 18, 32, 15,
  24, 12, 20, 29, 16, 23, 13, 27, 17, 31, 12, 22, 15, 26, 10, 19, 28, 14,
];

export const AudioMessage: React.FC<AudioMessageProps> = ({ url }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [url]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || isLoading || hasError) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setHasError(true);
      }
    } else {
      audio.pause();
    }
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const nextTime = Math.min(duration, Math.max(0, time));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    seekTo(ratio * duration);
  };

  const handleWaveformKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!duration) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekTo(currentTime + 5);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekTo(currentTime - 5);
    } else if (event.key === "Home") {
      event.preventDefault();
      seekTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      seekTo(duration);
    }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="w-[min(18rem,68vw)] min-w-[14rem] max-w-full py-1">
      <audio ref={audioRef} src={url} preload="metadata" />
      {hasError ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="flex-1 opacity-80">
            Não foi possível reproduzir o áudio.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              audioRef.current?.load();
            }}
            className="h-8 px-2 text-current hover:bg-current/10"
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void togglePlayPause()}
            disabled={isLoading}
            aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
            className="h-10 w-10 shrink-0 rounded-full bg-current/15 p-0 text-current hover:bg-current/25 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            )}
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div
              role="slider"
              tabIndex={duration ? 0 : -1}
              aria-label="Posição do áudio"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(currentTime)}
              aria-valuetext={`${formatTime(currentTime)} de ${formatTime(duration)}`}
              onClick={handleWaveformClick}
              onKeyDown={handleWaveformKeyDown}
              className={`flex h-10 min-w-0 flex-1 items-center justify-between gap-[2px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-current/60 ${duration ? "cursor-pointer" : "cursor-wait"}`}
            >
              {waveform.map((height, index) => {
                const played = (index / waveform.length) * 100 <= progress;
                return (
                  <span
                    key={index}
                    aria-hidden="true"
                    className={`w-[2px] shrink-0 rounded-full transition-colors ${played ? "bg-current" : "bg-current/35"}`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums opacity-80">
              {formatTime(isPlaying ? currentTime : duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
