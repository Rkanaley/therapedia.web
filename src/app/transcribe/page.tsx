'use client'

import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { Button } from '@/components/Button'
import useAudioTranscription from '@/hooks/useAudioTranscription'
import { listTranscriptions } from '@/services/apiService'
import { Transcription } from '@/types'
import * as apiService from '@/services/apiService'
import clsx from 'clsx'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const getParagraphs = (transcription: string[]) => {
  const paragraphs: string[] = []
  let currentParagraph = ''

  const includeParagraph = () => {
    if (currentParagraph) {
      paragraphs.push(capitalize(currentParagraph.toLowerCase()))
      currentParagraph = ''
    }
  }

  transcription.forEach((rawText) => {
    const textBlock = rawText.trim()
    if (textBlock) {
      currentParagraph += (currentParagraph ? ' ' : '') + textBlock
      // if (currentParagraph.length >= 20 && currentParagraph.endsWith('.')) {
      if (currentParagraph.endsWith('.')) {
        includeParagraph()
      }
    }
  })

  includeParagraph()

  return paragraphs
}

export default function Page() {
  const [token, setToken] = useState<string | null>(
    Cookies.get('token') || null,
  )
  const hasToken = !!token

  const { transcription, isRecording, setIsRecording, error } =
    useAudioTranscription(token)
  const [open, setOpen] = useState(false)

  const paragraphs = getParagraphs(transcription.map((t) => t.content))

  return (
    <div className="mx-4">
      <h1 className="mb-5 mt-5 font-display text-3xl tracking-tight text-slate-900 dark:text-white">
        Real-time Audio Transcription
      </h1>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      <div style={{ opacity: hasToken ? 1 : 0.5 }}>
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

        <div className="my-8 flex min-h-[400px] max-w-2xl rounded-3xl bg-sky-50 p-6 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10">
          <div className="flex-auto">
            <p
              className={clsx(
                'm-0 font-display text-xl',
                'text-sky-900 dark:text-sky-400',
              )}
            >
              Transcription
            </p>
            <div
              className={clsx(
                'prose mt-2.5',
                'text-sky-800 [--tw-prose-background:theme(colors.sky.50)] prose-a:text-sky-900 prose-code:text-sky-900 dark:text-slate-300 dark:prose-code:text-slate-300',
              )}
            >
              {paragraphs.length
                ? paragraphs.map((paragraph, index) => (
                    <p key={index} className="mb-1 mt-0">
                      {paragraph}
                    </p>
                  ))
                : 'Your transcription will appear here. Start recording to see it in action!'}
            </div>
          </div>
        </div>
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
  }, [token])

  const downloadText = (filename: string, text: string) => {
    const element = document.createElement('a')
    const file = new Blob([text], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
  }

  const onProcess = async (id: number) => {
    const data = await apiService.processTranscription(token, id)

    const { formattedText, summary } = data.result

    setTranscriptions((prevTranscriptions) => {
      const newTranscriptions = [...prevTranscriptions]

      const index = newTranscriptions.findIndex((t) => t.id === id)
      newTranscriptions[index] = {
        ...newTranscriptions[index],
        formattedText,
        summary,
      }

      return newTranscriptions
    })
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center overflow-auto bg-black bg-opacity-50 text-slate-900`}
    >
      <div className="flex max-h-[80vh] flex-col bg-blue-50 p-4">
        <div className="mb-4 flex min-w-[1000px] items-center justify-between rounded-lg">
          <h3 className="font-display text-xl tracking-tight text-slate-900">
            My Transcriptions
          </h3>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-scroll">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="bg-gray-50 px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  #
                </th>
                <th className="bg-gray-50 px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Preview
                </th>
                <th className="bg-gray-50 px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="bg-gray-50 px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transcriptions.map((t, index) => {
                const preview = !t.text ? '-' : t.text.slice(0, 40) + '...'
                const fullDate = new Date(t.createdAt).toLocaleString()
                const date = fullDate.slice(0, fullDate.length - 3)

                return (
                  <tr>
                    <td className="whitespace-nowrap px-2 py-2">
                      {transcriptions.length - index}.
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">{preview}</td>
                    <td className="whitespace-nowrap px-2 py-2">{date}</td>
                    <td className="flex items-center gap-2 whitespace-nowrap px-2 py-2">
                      {t.text && (
                        <>
                          <Button
                            variant="small"
                            onClick={() => onProcess(t.id)}
                          >
                            Process
                          </Button>

                          {t.summary && (
                            <Button
                              variant="link"
                              onClick={() =>
                                downloadText(`summary_${t.id}.txt`, t.summary)
                              }
                            >
                              Summary
                            </Button>
                          )}

                          {t.formattedText && (
                            <Button
                              variant="link"
                              onClick={() =>
                                downloadText(
                                  `formatted_${t.id}.txt`,
                                  t.formattedText,
                                )
                              }
                            >
                              Formatted
                            </Button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
