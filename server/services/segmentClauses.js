/**
 * Clause Segmentation Service
 * Implements deterministic regex-based section splitting (numbered sections, Roman numerals,
 * uppercase headings, standard legal paragraphs) with validation to preserve full text.
 */

export const segmentClausesDeterministically = (contractText) => {
  if (!contractText || typeof contractText !== 'string') {
    return [];
  }

  const text = contractText.trim();
  const lines = text.split('\n');
  const clauses = [];

  // Patterns for clause headers:
  // 1. "1. SCOPE OF WORK" or "1.1 Scope"
  // 2. "SECTION 1", "ARTICLE I", "CLAUSE 1"
  // 3. "I. DEFINITIONS", "A. Scope"
  // 4. "1) Scope", "(1) Scope"
  const sectionHeaderRegex = /^(?:(?:section|article|clause)\s+[0-9a-zA-Z]+[.:)]?|[0-9]{1,2}(?:\.[0-9]{1,2})*[.:)]|\([0-9a-zA-Z]{1,2}\)|[IVXLCDM]+[.:)]|[A-Z][.:)])\s*(.+)?/i;

  // All-caps heading line, e.g. "CONFIDENTIALITY AGREEMENT" or "SCOPE OF WORK"
  const allCapsHeadingRegex = /^[A-Z0-9\s,&/\\'-]{4,60}$/;

  let currentClauseText = [];
  let preambleText = [];
  let foundFirstHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      if (currentClauseText.length > 0) {
        currentClauseText.push('');
      } else if (!foundFirstHeader && preambleText.length > 0) {
        preambleText.push('');
      }
      continue;
    }

    const isHeader =
      sectionHeaderRegex.test(trimmedLine) ||
      (allCapsHeadingRegex.test(trimmedLine) &&
        trimmedLine.split(' ').length <= 8 &&
        !trimmedLine.endsWith('.') &&
        !trimmedLine.endsWith(','));

    if (isHeader) {
      if (currentClauseText.length > 0) {
        const fullClause = currentClauseText.join('\n').trim();
        if (fullClause) {
          clauses.push({
            id: `clause-${clauses.length + 1}`,
            text: fullClause,
            originalOrder: clauses.length + 1,
          });
        }
        currentClauseText = [];
      } else if (!foundFirstHeader && preambleText.length > 0) {
        // Preamble clause (e.g. Parties & Recitals)
        const fullPreamble = preambleText.join('\n').trim();
        if (fullPreamble) {
          clauses.push({
            id: 'clause-1',
            text: fullPreamble,
            originalOrder: 1,
          });
        }
        preambleText = [];
      }

      foundFirstHeader = true;
      currentClauseText.push(trimmedLine);
    } else {
      if (foundFirstHeader) {
        currentClauseText.push(rawLine);
      } else {
        preambleText.push(rawLine);
      }
    }
  }

  // Push remaining buffer
  if (currentClauseText.length > 0) {
    const fullClause = currentClauseText.join('\n').trim();
    if (fullClause) {
      clauses.push({
        id: `clause-${clauses.length + 1}`,
        text: fullClause,
        originalOrder: clauses.length + 1,
      });
    }
  } else if (!foundFirstHeader && preambleText.length > 0) {
    // If no explicit section headers were found, fall back to double-newline paragraph splitting
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    return paragraphs.map((para, idx) => ({
      id: `clause-${idx + 1}`,
      text: para,
      originalOrder: idx + 1,
    }));
  }

  // If preamble was collected before the first numbered section, insert it at beginning if not already added
  if (!foundFirstHeader && preambleText.length > 0 && clauses.length === 0) {
    const fullPreamble = preambleText.join('\n').trim();
    if (fullPreamble) {
      clauses.push({
        id: 'clause-1',
        text: fullPreamble,
        originalOrder: 1,
      });
    }
  }

  // Safety fallback if segmentation produced 0 clauses
  if (clauses.length === 0 && text.length > 0) {
    clauses.push({
      id: 'clause-1',
      text: text,
      originalOrder: 1,
    });
  }

  return clauses;
};
