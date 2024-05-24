'use client'

import React, { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { Button } from '@/components/Button'

export default function Page() {
  const socketRef = useRef<Socket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  const startRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start(1000) // Send data in chunks of 1 second
      setIsRecording(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  useEffect(() => {
    socketRef.current = io('http://localhost:8000')

    socketRef.current.on('transcription', (transcript: string) => {
      setTranscription((prev) => prev + ' ' + transcript)
    })

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream: MediaStream) => {
        try {
          const options = { mimeType: 'audio/webm' }
          mediaRecorderRef.current = new MediaRecorder(stream, options)
          mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
            if (event.data.size > 0) {
              event.data.arrayBuffer().then((buffer) => {
                socketRef.current?.emit('audio', new Uint8Array(buffer))
              })
            }
          }
        } catch (error) {
          console.error('Error initializing MediaRecorder:', error)
          setError('Error initializing MediaRecorder')
        }
      })
      .catch((error: Error) => {
        console.error('Error accessing microphone:', error)
        setError('Error accessing microphone: ' + error.message)
      })

    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      socketRef.current?.disconnect()
    }
  }, [])

  return (
    <div>
      <h1 className="mb-9 font-display text-3xl tracking-tight text-slate-900 dark:text-white">
        Real-time Audio Transcription
      </h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="mb-4 flex gap-4 md:justify-center lg:justify-start">
        <Button
          variant={isRecording ? 'secondary' : 'primary'}
          onClick={startRecording}
          disabled={isRecording}
        >
          Start Recording
        </Button>
        <Button
          variant={!isRecording ? 'secondary' : 'primary'}
          onClick={stopRecording}
          disabled={!isRecording}
        >
          Stop Recording
        </Button>
      </div>

      <h2 className="mb-4 font-display text-2xl tracking-tight text-slate-900 dark:text-white">
        Transcription:
      </h2>
      <p>{transcription}</p>
    </div>
  )
}
