'use client'

import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'

export default function Page() {
  const socketRef = useRef<Socket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState('')

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
          mediaRecorderRef.current.start(1000) // Send data in chunks of 1 second
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
      <h1>Real-time Audio Transcription</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Recording audio and sending to server...</p>
      <p>Transcription: {transcription}</p>
    </div>
  )
}
