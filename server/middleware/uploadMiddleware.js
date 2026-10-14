import multer from 'multer';
import path from 'path';

// Memory storage to avoid leaving temporary files on disk
const storage = multer.memoryStorage();

const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10);

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'application/octet-stream', // Some browsers send octet-stream for docx
  ];

  if (!allowedExts.includes(ext)) {
    return cb(
      new Error(
        `Unsupported file extension '${ext}'. LexiGuard only accepts .pdf, .docx, and .txt files.`
      ),
      false
    );
  }

  if (!allowedMimeTypes.includes(file.mimetype) && file.mimetype !== 'application/octet-stream') {
    return cb(
      new Error(
        `Invalid file MIME type '${file.mimetype}'. Please upload a standard PDF, DOCX, or text document.`
      ),
      false
    );
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});

/**
 * Validate actual file magic bytes (file signature)
 */
export const validateFileSignature = (buffer, filename) => {
  if (!buffer || buffer.length < 4) {
    return { valid: false, message: 'Document file buffer is empty or corrupted.' };
  }

  const ext = path.extname(filename).toLowerCase();
  const headerHex = buffer.subarray(0, 4).toString('hex').toLowerCase();

  if (ext === '.pdf') {
    // PDF magic bytes: 25 50 44 46 (%PDF)
    const isPdf = buffer.subarray(0, 4).toString('utf-8') === '%PDF';
    if (!isPdf) {
      return {
        valid: false,
        message: 'The uploaded file does not match a valid PDF file signature.',
      };
    }
  } else if (ext === '.docx') {
    // DOCX files are zip archives starting with 50 4b 03 04 (PK\x03\x04)
    const isZip = headerHex.startsWith('504b0304');
    if (!isZip) {
      return {
        valid: false,
        message: 'The uploaded file does not match a valid DOCX file signature.',
      };
    }
  }

  return { valid: true };
};
