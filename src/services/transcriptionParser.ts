export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const getParagraphs = (transcription: string[]) => {
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
