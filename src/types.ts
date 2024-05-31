export type TranscriptionResults = {
  Alternatives: [
    {
      Items: {
        Content: string
        EndTime: number
        StartTime: number
        Type: 'pronunciation' | 'punctuation' | string
        VocabularyFilterMatch: boolean
      }[]
      Transcript: string
    },
  ]
  ChannelId: string
  EndTime: number
  IsPartial: boolean
  ResultId: string
  StartTime: number
}[]
