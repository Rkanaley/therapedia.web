'use client'

import { useEffect, useRef } from 'react'
import io, { Socket } from 'socket.io-client'

export default function Page() {
  const socketRef = useRef<Socket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    socketRef.current = io()

    const handleSuccess = (stream: MediaStream) => {
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          socketRef.current?.emit('audio', event.data)
        }
      }
      mediaRecorderRef.current.start(1000)
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(handleSuccess)
      .catch((err) => console.error('Error accessing microphone:', err))

    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      socketRef.current?.disconnect()
    }
  }, [])

  return (
    <div>
      <h1>Real-time Audio Transcription</h1>
      <p>Recording audio and sending to server...</p>
    </div>
  )
}
