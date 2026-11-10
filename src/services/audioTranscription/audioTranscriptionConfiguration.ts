import { api } from "@/services/api";
import type {
  AudioTranscriptionConfiguration,
  SaveAudioTranscriptionConfigurationParams,
} from "@/types/audio-transcription";

const CONFIGURATION_URL = "/operation/audio-transcription/configuration";

export async function getAudioTranscriptionConfiguration(): Promise<AudioTranscriptionConfiguration> {
  const { data } = await api.get<AudioTranscriptionConfiguration>(CONFIGURATION_URL);
  return data;
}

export async function saveAudioTranscriptionConfiguration(
  params: SaveAudioTranscriptionConfigurationParams,
): Promise<AudioTranscriptionConfiguration> {
  const { data } = await api.put<AudioTranscriptionConfiguration>(CONFIGURATION_URL, {
    apiKey: params.apiKey,
  });
  return data;
}

export async function deleteAudioTranscriptionConfiguration(): Promise<AudioTranscriptionConfiguration> {
  const { data } = await api.delete<AudioTranscriptionConfiguration>(CONFIGURATION_URL);
  return data;
}
