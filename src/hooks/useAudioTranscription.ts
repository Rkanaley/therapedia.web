import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'

const useAudioTranscription = (token: string | null) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const audioBufferRef = useRef<Float32Array[]>([])

  const [transcription, setTranscription] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('No authorisation provided!')
    }

    try {
      socketRef.current = io(getWebSocketUrl(), {
        query: { token },
      })
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

        await audioContextRef.current.audioWorklet.addModule('/worklet.js')
        const source = audioContextRef.current.createMediaStreamSource(stream)

        workletNodeRef.current = new AudioWorkletNode(
          audioContextRef.current,
          'audio-processor',
        )

        workletNodeRef.current.port.onmessage = (event) => {
          const inputData = event.data
          audioBufferRef.current.push(new Float32Array(inputData))
        }

        source.connect(workletNodeRef.current)
        workletNodeRef.current.connect(audioContextRef.current.destination)
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
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect()
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }

      socketRef.current?.disconnect()
    }
  }, [isRecording, token])

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
