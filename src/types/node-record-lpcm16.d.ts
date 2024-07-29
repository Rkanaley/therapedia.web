declare module 'node-record-lpcm16' {
    interface Options {
      sampleRate?: number;
      channels?: number;
      threshold?: number;
      endOnSilence?: boolean;
      silence?: string;
      device?: string;
      verbose?: boolean;
      audioType?: string;
    }
  
    interface RecorderInstance {
      stream(): NodeJS.ReadableStream;
      stop(): void;
    }
  
    interface Recorder {
      record(options?: Options): RecorderInstance;
    }
  
    const recorder: Recorder;
  
    export = recorder;
  }
  