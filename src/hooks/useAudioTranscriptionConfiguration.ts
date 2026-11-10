import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAudioTranscriptionConfiguration,
  getAudioTranscriptionConfiguration,
  saveAudioTranscriptionConfiguration,
} from "@/services/audioTranscription/audioTranscriptionConfiguration";
import type { AudioTranscriptionConfiguration } from "@/types/audio-transcription";

export const AUDIO_TRANSCRIPTION_CONFIGURATION_KEY = [
  "audio-transcription",
  "configuration",
] as const;

/** The endpoint requires manage:operation-setup, so only enable it for admins. */
export function useAudioTranscriptionConfiguration(enabled: boolean) {
  return useQuery({
    queryKey: AUDIO_TRANSCRIPTION_CONFIGURATION_KEY,
    queryFn: getAudioTranscriptionConfiguration,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useSaveAudioTranscriptionConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveAudioTranscriptionConfiguration,
    onSuccess: (data: AudioTranscriptionConfiguration) => {
      queryClient.setQueryData(AUDIO_TRANSCRIPTION_CONFIGURATION_KEY, data);
    },
  });
}

export function useDeleteAudioTranscriptionConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAudioTranscriptionConfiguration,
    onSuccess: (data: AudioTranscriptionConfiguration) => {
      queryClient.setQueryData(AUDIO_TRANSCRIPTION_CONFIGURATION_KEY, data);
    },
  });
}
