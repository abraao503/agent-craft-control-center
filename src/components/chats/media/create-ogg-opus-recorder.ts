import opusMediaRecorderScriptUrl from "opus-media-recorder/OpusMediaRecorder.umd.js?url";
import opusMediaRecorderWorkerUrl from "opus-media-recorder/encoderWorker.umd.js?url";
import oggOpusEncoderWasmUrl from "opus-media-recorder/OggOpusEncoder.wasm?url";

export const OGG_OPUS_MIME_TYPE = "audio/ogg; codecs=opus";

let encoderLoadPromise: Promise<OpusMediaRecorderConstructor> | null = null;

const loadEncoder = () => {
  if (window.OpusMediaRecorder) {
    return Promise.resolve(window.OpusMediaRecorder);
  }

  if (!encoderLoadPromise) {
    encoderLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = opusMediaRecorderScriptUrl;
      const fail = () => {
        encoderLoadPromise = null;
        script.remove();
        reject(new Error("OPUS_MEDIA_RECORDER_LOAD_FAILED"));
      };
      script.onerror = fail;
      script.onload = () => {
        if (!window.OpusMediaRecorder) {
          fail();
          return;
        }
        resolve(window.OpusMediaRecorder);
      };
      document.head.appendChild(script);
    });
  }

  return encoderLoadPromise;
};

export const createOggOpusRecorder = async (stream: MediaStream) => {
  // Use the same encoder across browsers and operating systems. Native MP4
  // recordings can play locally while being rejected by WhatsApp's media engine.
  const Encoder = await loadEncoder();
  const recorder = new Encoder(
    stream,
    { mimeType: OGG_OPUS_MIME_TYPE, audioBitsPerSecond: 32000 },
    {
      encoderWorkerFactory: () => new Worker(opusMediaRecorderWorkerUrl),
      OggOpusEncoderWasmPath: oggOpusEncoderWasmUrl,
    },
  );
  return { recorder, mimeType: OGG_OPUS_MIME_TYPE };
};

export const isOggOpusRecording = async (blob: Blob): Promise<boolean> => {
  const header = new Uint8Array(await blob.slice(0, 64).arrayBuffer());
  const opusSignature = [0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64];
  const opusHeaderOffset = header.findIndex((_, offset) =>
    opusSignature.every((byte, index) => header[offset + index] === byte),
  );
  return (
    header[0] === 0x4f && header[1] === 0x67 &&
    header[2] === 0x67 && header[3] === 0x53 &&
    opusHeaderOffset >= 0 && header[opusHeaderOffset + 9] === 1
  );
};
