'use client'

import React, { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import Cookies from 'js-cookie'
import { Button } from '@/components/Button'

const getWebSocketUrl = () => {
  console.log(process.env.NEXT_PUBLIC_WS_URL)
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
}

export default function Page() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const audioBufferRef = useRef<Float32Array[]>([])

  const [transcription, setTranscription] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [token, setToken] = useState<string | null>(
    Cookies.get('token') || null,
  )
  const hasToken = !!token // This does not mean they are authenticated, we just allow them to click around.

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

  return (
    <div className="mx-4">
      <h1 className="mb-5 mt-5 font-display text-3xl tracking-tight text-slate-900 dark:text-white">
        Real-time Audio Transcription
      </h1>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      <div className="mb-4 flex justify-start gap-4">
        <Button
          variant={isRecording ? 'secondary' : 'primary'}
          onClick={() => setIsRecording(true)}
          disabled={isRecording || !hasToken}
        >
          Start Recording
        </Button>
        <Button
          variant={!isRecording ? 'secondary' : 'primary'}
          onClick={() => setIsRecording(false)}
          disabled={!isRecording || !hasToken}
        >
          Stop Recording
        </Button>
      </div>

      <h2 className="mb-5 font-display text-2xl tracking-tight text-slate-900 dark:text-white">
        Transcription:
      </h2>
      <p>{transcription}</p>
    </div>
  )
}
