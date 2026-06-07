import Tesseract from 'tesseract.js'
import sharp from 'sharp'

export async function processImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
  // Pre-process image using sharp to improve OCR accuracy
  // Convert to grayscale, increase contrast, and normalize
  return await sharp(imageBuffer)
    .grayscale()
    .normalize()
    .linear(1.5, -(128 * 0.5)) // Increase contrast
    .toBuffer()
}

export async function verifyDocument(imageBuffer: Buffer, documentType: string) {
  try {
    const processedImage = await processImageForOCR(imageBuffer)
    
    const { data: { text, confidence } } = await Tesseract.recognize(
      processedImage,
      'eng',
      { logger: m => console.log(m) }
    )

    // A basic confidence check based on OCR output
    // In a real scenario, you'd use transformers.js here to classify the text
    // matching against expected keywords for `documentType` (e.g., 'Hospital', 'Invoice', 'Tuition')
    
    const keywords = text.toLowerCase()
    let score = confidence

    if (documentType === 'medical' && (keywords.includes('hospital') || keywords.includes('clinic') || keywords.includes('bill'))) {
      score += 10
    } else if (documentType === 'student' && (keywords.includes('school') || keywords.includes('college') || keywords.includes('university') || keywords.includes('tuition'))) {
      score += 10
    }

    return {
      success: true,
      text: text.substring(0, 500), // First 500 chars
      confidence: Math.min(score, 100),
      isVerified: score > 75
    }
  } catch (error: unknown) {
    console.error('OCR Error:', error)
    const message = error instanceof Error ? error.message : 'OCR processing failed'
    return {
      success: false,
      error: message
    }
  }
}
