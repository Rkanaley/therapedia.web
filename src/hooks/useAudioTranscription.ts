import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { TranscriptionResults } from '@/types'
import * as apiService from '@/services/apiService'

const useAudioTranscription = (token: string | null) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const audioBufferRef = useRef<Float32Array[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const [transcriptionId, setTranscriptionId] = useState<number | undefined>()

  const [transcription, setTranscription] = useState<
    { content: string; id: string }[]
  >([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRecording && token) {
      startRecording().then(() => {
        if (audioContextRef.current) {
          const chunkSize = 6400
          initializeSocket(token, audioContextRef.current.sampleRate, chunkSize)
        }
      })

      const sendIntervalId = setInterval(sendBufferedAudio, 2500)

      return () => {
        clearInterval(sendIntervalId)
        stopRecording()
        cleanupResources()
        saveTranscriptionInDB()
      }
    } else {
      stopRecording()
      cleanupResources()
    }

    return () => {
      stopRecording()
      cleanupResources()
    }
  }, [isRecording, token])

  useEffect(() => {
    if (isRecording && transcriptionId) {
      if (debouncerRef.current) {
        clearTimeout(debouncerRef.current)
      }

      debouncerRef.current = setTimeout(() => {
        saveTranscriptionInDB()
      }, 2000)

      return () => {
        if (debouncerRef.current) {
          clearTimeout(debouncerRef.current)
        }
      }
    }
  }, [transcription])

  const initializeSocket = (
    token: string,
    sampleRate: number,
    chunkSize: number,
  ) => {
    if (socketRef.current) {
      return // Avoid initializing the socket again if it's already initialized
    }

    try {
      socketRef.current = io(getWebSocketUrl(), {
        query: { token, sampleRate, chunkSize },
      })

      socketRef.current.on(
        'transcriptionResults',
        (transcriptionResults: TranscriptionResults) => {
          setTranscription((prev) => {
            const newTranscriptions = [...prev]

            transcriptionResults.forEach((transcriptionResult) => {
              let index = newTranscriptions.findIndex(
                (t) => t.id === transcriptionResult.ResultId,
              )
              if (index === -1) {
                index = newTranscriptions.length
              }

              const transcripts = transcriptionResult.Alternatives.map(
                (alt) => {
                  return alt.Transcript || ''
                },
              )
                .filter(Boolean)
                .sort((a, b) => a.length - b.length)

              const longestTranscript = transcripts[transcripts.length - 1]

              newTranscriptions[index] = {
                content: longestTranscript,
                id: transcriptionResult.ResultId,
              }
            })
            return newTranscriptions
          })
        },
      )
    } catch (error) {
      setError('Error connecting to the server!')
    }
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia not supported on your browser!')
      return
    }

    const audioContext = new window.AudioContext()
    audioContextRef.current = audioContext

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      await audioContext.audioWorklet.addModule('/worklet.js')
      const source = audioContext.createMediaStreamSource(stream)

      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor')
      workletNodeRef.current = workletNode

      workletNode.port.onmessage = (event) => {
        const inputData = event.data
        audioBufferRef.current.push(new Float32Array(inputData))
      }

      source.connect(workletNode)
      workletNode.connect(audioContext.destination)

      const id = await createTranscriptionInDb()
      setTranscriptionId(id)
    } catch (err) {
      console.error('Unexpected error occurred', err)
      setError('Unexpected error occurred')
    }
  }

  const stopRecording = () => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
  }

  const sendBufferedAudio = () => {
    if (audioBufferRef.current.length > 0 && socketRef.current?.connected) {
      const bufferedData = flattenAudioBuffer(audioBufferRef.current)
      const int16Array = convertToPCM(bufferedData)
      socketRef.current.emit('audio', int16Array.buffer)
      audioBufferRef.current = []
    }
  }

  const cleanupResources = () => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    socketRef.current?.disconnect()
    socketRef.current = null
  }

  const createTranscriptionInDb = async (): Promise<number> => {
    if (transcriptionId) {
      return transcriptionId
    }

    if (!token) {
      throw new Error('No token provided')
    }

    return await apiService.createTranscription(token)
  }

  const saveTranscriptionInDB = async (isFinalUpdate = false) => {
    if (!transcriptionId || !token) {
      return
    }

    const latestTranscription = transcription.map((t) => t.content).join('\n')
    await apiService.updateTranscription(
      token,
      transcriptionId,
      latestTranscription,
    )
  }

  return { transcription, isRecording, setIsRecording, error }
}

const getWebSocketUrl = () => {
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
}

const flattenAudioBuffer = (audioBufferArray: Float32Array[]) => {
  const length = audioBufferArray.reduce((acc, cur) => acc + cur.length, 0)
  const result = new Float32Array(length)
  let offset = 0
  for (const buffer of audioBufferArray) {
    result.set(buffer, offset)
    offset += buffer.length
  }
  return result
}

const convertToPCM = (buffer: Float32Array) => {
  const pcmData = new Int16Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    pcmData[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff
  }
  return pcmData
}

export default useAudioTranscription
