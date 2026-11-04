declare global {
  interface OpusMediaRecorderWorkerOptions {
    encoderWorkerFactory?: () => Worker;
    OggOpusEncoderWasmPath?: string;
    WebMOpusEncoderWasmPath?: string;
  }

  interface OpusMediaRecorderConstructor {
    new (
      stream: MediaStream,
      options?: MediaRecorderOptions,
      workerOptions?: OpusMediaRecorderWorkerOptions,
    ): MediaRecorder;
  }

  interface Window {
    OpusMediaRecorder?: OpusMediaRecorderConstructor;
  }
}

export {};
