export type TranscriptionResults = {
  id: string;
  status: string;
  audio_url: string;
  text: string;
  summary?: string;
  formattedText?: string;
  // Add any other fields returned by AssemblyAI
};

export type Transcription = {
  id: number;
  userId: number;
  text: string;
  formattedText: string;
  summary: string;
  createdAt: string;
};

export type RealtimeTranscript = {
  message_type: 'FinalTranscript' | 'PartialTranscript';
  text: string;
  confidence?: number;
  words?: { start: number; end: number; text: string; confidence: number }[];
  // Add any other fields returned by AssemblyAI
};
