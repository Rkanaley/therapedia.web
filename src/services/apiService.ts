import { AssemblyAI, RealtimeTranscript } from 'assemblyai';
import recorder from 'node-record-lpcm16';
import axios from 'axios';
import { Transcription, TranscriptionResults } from '../types';

// Initialize AssemblyAI client with your API key
const assembly = new AssemblyAI({
  apiKey: 'd6d5d9f47500453187c2ed1fc357e173',
});

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });

  return response.data;
};

export const validateToken = async (token: string) => {
  const response = await axios.post(
    `${API_URL}/auth/validate`,
    { token },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.status === 200;
};

// Create transcription from audio URL
export const createTranscription = async (audioUrl: string): Promise<string> => {
  const response = await assembly.transcripts.transcribe({ audio_url: audioUrl });
  if (!response || !response.id) {
    throw new Error('Failed to create transcription');
  }
  return response.id;
};

// Get transcription result
export const getTranscriptionResult = async (transcriptionId: string): Promise<TranscriptionResults> => {
  const transcript = await assembly.transcripts.get(transcriptionId);
  if (!transcript) {
    throw new Error('Failed to fetch transcription');
  }
  return transcript as TranscriptionResults;
};

// Get transcription summary
export const getTranscriptionSummary = async (transcriptionId: string): Promise<string> => {
  const transcript = await getTranscriptionResult(transcriptionId);
  return transcript.summary || '';
};

// Get formatted transcription
export const getFormattedTranscription = async (transcriptionId: string): Promise<string> => {
  const transcript = await getTranscriptionResult(transcriptionId);
  return transcript.formattedText || '';
};

// List all transcriptions
export const listTranscriptions = async (token: string): Promise<Transcription[]> => {
  const response = await axios.get(`${API_URL}/transcriptions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data as Transcription[];
};
// Function for real-time transcription
export const startR: any = null;
