'use client'

import React, { useState } from 'react'
import Cookies from 'js-cookie'
import { Button } from '@/components/Button'
import useAudioTranscription from '@/hooks/useAudioTranscription'

export default function Page() {
  const [token, setToken] = useState<string | null>(
    Cookies.get('token') || null,
  )
  // We assume it is valid, but the backend will reject it if it is not
  const hasToken = !!token

  const { transcription, isRecording, setIsRecording, error } =
    useAudioTranscription(token)

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
        </div>

        <h2
          className={`mb-5 font-display text-2xl tracking-tight text-slate-900 dark:text-white`}
        >
          Transcription:
        </h2>
        <p>{transcription}</p>
      </div>
    </div>
  )
}
