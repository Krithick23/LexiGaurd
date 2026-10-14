import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { normalizeContractText } from '../utils/sanitize.js';

export const extractTextFromBuffer = async (buffer, originalname) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('The uploaded document is empty (0 bytes). Please provide a valid file.');
  }

  const ext = path.extname(originalname).toLowerCase();
  let extractedRaw = '';

  if (ext === '.pdf') {
    try {
      const pdfData = await pdfParse(buffer, {
        // Limit max pages to prevent memory exhaustion (e.g., max 100 pages)
        max: 100,
      });

      extractedRaw = pdfData.text || '';

      // Check for scanned / non-selectable PDF
      if (!extractedRaw.trim() || extractedRaw.trim().length < 50) {
        throw new Error(
          'Could not extract text from this PDF. The document may be scanned or image-based, password-protected, or empty. LexiGuard currently analyzes text-based contracts and does not perform OCR on scanned images.'
        );
      }
    } catch (pdfErr) {
      if (pdfErr.message.includes('password') || pdfErr.name === 'PasswordException') {
        throw new Error('This PDF is password-protected or encrypted. Please remove the password and re-upload.');
      }
      throw new Error(`PDF extraction failed: ${pdfErr.message}`);
    }
  } else if (ext === '.docx' || ext === '.doc') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedRaw = result.value || '';

      if (result.messages && result.messages.length > 0) {
        const errors = result.messages.filter((m) => m.type === 'error');
        if (errors.length > 0) {
          console.warn(`[DOCX Warning] Extraction messages: ${JSON.stringify(errors)}`);
        }
      }

      if (!extractedRaw.trim() || extractedRaw.trim().length < 20) {
        throw new Error(
          'Could not extract text from this Word document. Please ensure it contains readable text and is not empty or corrupted.'
        );
      }
    } catch (docxErr) {
      throw new Error(`Word document extraction failed: ${docxErr.message}`);
    }
  } else if (ext === '.txt') {
    try {
      extractedRaw = buffer.toString('utf-8');
      if (!extractedRaw.trim()) {
        throw new Error('The uploaded text file is completely empty.');
      }
    } catch (txtErr) {
      throw new Error(`Text file read error: ${txtErr.message}`);
    }
  } else {
    throw new Error(`Unsupported file extension '${ext}'. Supported formats: PDF, DOCX, TXT.`);
  }

  const normalized = normalizeContractText(extractedRaw);

  if (normalized.length < 50) {
    throw new Error(
      'The document text is too short to be recognized as an agreement (fewer than 50 characters). Please upload a complete contract.'
    );
  }

  return normalized;
};
