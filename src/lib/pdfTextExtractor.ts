/**
 * PDF Validation and Text Extraction Utility for LinkedIn Profile Exports
 */

export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
  fileSizeFormatted?: string;
  detectedSections?: string[];
  extractedText?: string;
}

export async function validateAndExtractLinkedInPdf(file: File): Promise<PdfValidationResult> {
  // 1. File type validation
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return { isValid: false, error: 'Invalid file format. Please upload an authentic PDF (.pdf) exported from LinkedIn.' };
  }

  // 2. File size validation (Min > 0, Max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size === 0) {
    return { isValid: false, error: 'The selected PDF file is empty (0 bytes).' };
  }
  if (file.size > MAX_SIZE) {
    return { isValid: false, error: 'File size exceeds 10MB limit. Please upload a standard LinkedIn profile PDF.' };
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 3. Readability & Magic Signature Header validation
  try {
    const headerBuffer = await file.slice(0, 8).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);
    const headerStr = String.fromCharCode(...headerBytes);
    if (!headerStr.startsWith('%PDF-')) {
      return { isValid: false, error: 'Corrupted or unreadable PDF: Missing %PDF- file header signature.' };
    }

    // Read buffer for text stream recovery
    const fullBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    const rawPdfString = decoder.decode(fullBuffer);

    // Extract text from text blocks BT ... ET
    const textMatches: string[] = [];
    
    // Tj operator: (Text) Tj
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(rawPdfString)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        textMatches.push(match[1].replace(/\\([()\\])/g, '$1').trim());
      }
    }

    // TJ operator array: [(Text) 12 (More)] TJ
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(rawPdfString)) !== null) {
      const innerTj = match[1];
      const innerStrings = innerTj.match(/\(([^)]+)\)/g);
      if (innerStrings) {
        const assembled = innerStrings.map(s => s.slice(1, -1).replace(/\\([()\\])/g, '$1')).join('');
        if (assembled.trim().length > 0) {
          textMatches.push(assembled.trim());
        }
      }
    }

    let extractedText = textMatches.join(' ');
    if (extractedText.length < 60) {
      // Fallback regex to capture printable strings
      const generalStrings = rawPdfString.match(/[A-Za-z0-9 .,/\\-_:;@()#&+]{4,}/g) || [];
      const filtered = generalStrings.filter(s => 
        !s.startsWith('obj') && 
        !s.startsWith('endobj') && 
        !s.startsWith('xref') && 
        !s.startsWith('stream') &&
        !s.includes('Font') &&
        !s.includes('Filter')
      );
      extractedText = filtered.slice(0, 160).join(' ');
    }

    // Detect common LinkedIn export sections
    const knownSections = ['Experience', 'Education', 'Skills', 'Certifications', 'Summary', 'Contact', 'Languages', 'Honors'];
    const detectedSections = knownSections.filter(sec => 
      new RegExp(`\\b${sec}\\b`, 'i').test(rawPdfString) || new RegExp(`\\b${sec}\\b`, 'i').test(extractedText)
    );

    return {
      isValid: true,
      fileSizeFormatted: formatSize(file.size),
      detectedSections,
      extractedText: extractedText.trim(),
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Failed to read PDF stream: ${err?.message || 'Unknown read error'}`,
    };
  }
}
