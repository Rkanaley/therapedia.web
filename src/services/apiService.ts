import axios from 'axios'
import { Transcription } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  })

  return response.data
}

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
  )

  return response.status === 200
}

export const createTranscription = async (token: string): Promise<number> => {
  const response = await axios.post(
    `${API_URL}/transcriptions`,
    { text: '' },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (response.status !== 201) {
    throw new Error('Failed to create transcription')
  }

  const { id } = response.data
  return id
}

export const updateTranscription = async (
  token: string,
  transcriptionId: number,
  text: string,
) => {
  await axios.put(
    `${API_URL}/transcriptions/${transcriptionId}`,
    { text },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  )
}

export const listTranscriptions = async (token: string) => {
  const res = await axios.get(`${API_URL}/transcriptions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  return res.data as Transcription[]
}
