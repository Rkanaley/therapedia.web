// useAudioTranscription.ts
import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'

const useAudioTranscription = (token: string | null) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const audioBufferRef = useRef<Float32Array[]>([])

  const [transcription, setTranscription] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      socketRef.current = io(getWebSocketUrl())
    } catch (error) {
      setError('Error connecting to the server!')
      return
    }

    socketRef.current.on('transcription', (transcript: string) => {
      setTranscription((prev) => prev + ' ' + transcript)
    })

    const startRecording = async () => {
      if (!navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported on your browser!')
        return
      }

      audioContextRef.current = new window.AudioContext()

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })

        const source = audioContextRef.current.createMediaStreamSource(stream)

        scriptProcessorRef.current =
          audioContextRef.current.createScriptProcessor(4096, 1, 1)

        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
          const inputBuffer = audioProcessingEvent.inputBuffer
          const inputData = inputBuffer.getChannelData(0)

          audioBufferRef.current.push(new Float32Array(inputData))
        }

        source.connect(scriptProcessorRef.current)
        scriptProcessorRef.current.connect(audioContextRef.current.destination)
      } catch (err) {
        console.error('Error accessing audio devices.', err)
        setError('Error accessing audio devices.')
      }
    }

    const stopRecording = () => {
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect()
        scriptProcessorRef.current.onaudioprocess = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
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

    if (isRecording) {
      startRecording()
      const intervalId = setInterval(sendBufferedAudio, 1000)
      return () => clearInterval(intervalId)
    } else {
      stopRecording()
    }

    return () => {
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect()
        scriptProcessorRef.current.onaudioprocess = null
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }

      socketRef.current?.disconnect()
    }
  }, [isRecording])

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
