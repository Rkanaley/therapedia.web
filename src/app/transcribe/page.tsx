'use client'

import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { Button } from '@/components/Button'
import useAudioTranscription from '@/hooks/useAudioTranscription'
import { listTranscriptions } from '@/services/apiService'
import { Transcription } from '@/types'

export default function Page() {
  const [token, setToken] = useState<string | null>(
    Cookies.get('token') || null,
  )
  // We assume it is valid, but the backend will reject it if it is not
  const hasToken = !!token

  const { transcription, isRecording, setIsRecording, error } =
    useAudioTranscription(token)

  const [open, setOpen] = useState(false)

  return (
    <div className="mx-4">
      <h1 className="mb-5 mt-5 font-display text-3xl tracking-tight text-slate-900 dark:text-white">
        Real-time Audio Transcription
      </h1>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      <div className="max-w-lg" style={{ opacity: hasToken ? 1 : 0.5 }}>
        <div className="mb-4 flex justify-start gap-4">
          <Button
            variant={
              !hasToken ? 'secondary' : isRecording ? 'secondary' : 'primary'
            }
            onClick={() => setIsRecording(true)}
            disabled={isRecording || !hasToken}
          >
            Start Recording
          </Button>
          <Button
            variant={
              !hasToken ? 'secondary' : !isRecording ? 'secondary' : 'primary'
            }
            onClick={() => setIsRecording(false)}
            disabled={!isRecording || !hasToken}
          >
            Stop Recording
          </Button>

          <Button variant="primary" onClick={() => setOpen(true)}>
            View Transcriptions
          </Button>
        </div>

        <h2
          className={`mb-5 font-display text-2xl tracking-tight text-slate-900 dark:text-white`}
        >
          Transcription:
        </h2>

        {transcription.map((t) => {
          return <p key={t.id}>{t.content}</p>
        })}
      </div>

      {open && token && (
        <MyTranscriptionsModal token={token} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}

const MyTranscriptionsModal: React.FC<{
  token: string
  onClose: () => void
}> = ({ token, onClose }) => {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])

  useEffect(() => {
    listTranscriptions(token).then((data) => {
      setTranscriptions(data)
    })
  }, [])

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-slate-900`}
    >
      <div className="bg-blue-50  p-4">
        <div className="mb-4 flex min-w-[700px] items-center justify-between rounded-lg">
          <h3 className="font-display text-xl tracking-tight text-slate-900">
            My Transcriptions
          </h3>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>

        {transcriptions.reverse().map((t, index) => {
          const preview = !t.text ? '-' : t.text.slice(0, 40) + '...'
          const date = new Date(t.createdAt).toLocaleString()

          return (
            <div key={t.id} className="flex gap-5">
              <div>{transcriptions.length - index}.</div>
              <div>{preview}</div>
              <div>{date}</div>
              <div>Actions</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
