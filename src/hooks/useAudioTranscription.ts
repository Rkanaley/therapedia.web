import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'

const useAudioTranscription = (token: string | null) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const audioBufferRef = useRef<Float32Array[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null) // Add mediaStreamRef

  const [transcription, setTranscription] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isRecording && token) {
      startRecording().then(() => {
        if (audioContextRef.current) {
          // Set chunk size
          const chunkSize = 8800
          // Initialize socket
          initializeSocket(token, audioContextRef.current.sampleRate, chunkSize)
        }
      })
      const intervalId = setInterval(sendBufferedAudio, 500)

      return () => {
        clearInterval(intervalId)
        stopRecording()
        cleanupResources()
      }
    } else {
      stopRecording()
      cleanupResources()
    }

    // Cleanup function for useEffect
    return () => {
      stopRecording()
      cleanupResources()
    }
  }, [isRecording, token])

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

      socketRef.current.on('transcription', (transcript: string) => {
        setTranscription((prev) => `${prev} ${transcript}`)
      })
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
    } catch (err) {
      console.error('Error accessing audio devices.', err)
      setError('Error accessing audio devices.')
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
      mediaStreamRef.current.getTracks().forEach((track) => track.stop()) // Stop all media tracks
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
      mediaStreamRef.current.getTracks().forEach((track) => track.stop()) // Stop all media tracks
      mediaStreamRef.current = null
    }
    socketRef.current?.disconnect()
    socketRef.current = null // Reset socket to ensure it can be re-initialized
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
  const pcmData = new Int32Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    pcmData[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff
  }
  return pcmData
}

export default useAudioTranscription
