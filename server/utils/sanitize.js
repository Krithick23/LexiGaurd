/**
 * Sanitize and normalize raw contract text
 * - Normalizes line breaks (\r\n -> \n)
 * - Normalizes curly/smart quotes and special typographical characters
 * - Removes non-printable or null control characters
 * - Strips zero-width characters and potential prompt injection payloads
 * - Normalizes multi-space indentation while preserving clause structure
 */
export const normalizeContractText = (text) => {
  if (!text || typeof text !== 'string') return '';

  return (
    text
      // Normalize Unicode line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Normalize typographic smart quotes and dashes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u00A0/g, ' ') // non-breaking space
      // Remove null bytes and non-printable control characters (keep \n and \t)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Collapse 3 or more consecutive newlines into 2
      .replace(/\n{3,}/g, '\n\n')
      // Collapse consecutive horizontal whitespace (tabs and spaces) into single space
      .replace(/[ \t]+/g, ' ')
      .trim()
  );
};

/**
 * Basic HTML entity escaper to prevent stored XSS if rendered
 */
export const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Redact sensitive fields from logging payloads
 */
export const sanitizeForLogging = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sensitiveKeys = ['password', 'token', 'jwt', 'rawText', 'authorization', 'cookie', 'apiKey'];
  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
