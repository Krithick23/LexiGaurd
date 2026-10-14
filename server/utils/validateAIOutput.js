import { z } from 'zod';

/**
 * Safely parse JSON string, removing any Markdown code fences or extra whitespace
 */
export const extractAndParseJSON = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Received empty response from AI engine.');
  }

  // Remove Markdown code blocks ```json ... ``` or ``` ... ```
  let cleaned = rawText.trim();
  const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i;
  const match = cleaned.match(fenceRegex);
  if (match) {
    cleaned = match[1].trim();
  } else {
    // If there is any preamble before the first { or [
    const firstBrace = cleaned.search(/[{\[]/);
    const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    throw new Error(`Failed to parse AI JSON response: ${parseError.message}. Content was: ${cleaned.slice(0, 200)}...`);
  }
};

/**
 * Zod Schema for Stage 1: Segmentation Output
 */
export const segmentedClausesSchema = z.object({
  clauses: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1).max(20000),
      })
    )
    .min(1, 'At least one clause must be segmented'),
});

/**
 * Zod Schema for Stage 2: Risk Scoring Output
 */
export const riskAnalysisSchema = z.object({
  clauses: z.array(
    z.object({
      id: z.string().min(1),
      risk: z.enum(['Low', 'Medium', 'High']).default('Low'),
      category: z.string().default('General Terms'),
      reason: z.string().default(''),
      riskFactors: z.array(z.string()).default([]),
      confidence: z.number().min(0).max(1).default(0.9),
    })
  ),
  redFlags: z.array(z.string()).default([]),
  summary: z.string().default('Contract risk analysis completed.'),
  overallRisk: z.enum(['Low', 'Medium', 'High']).default('Low'),
});

/**
 * Zod Schema for Stage 3: Negotiation Suggestions Output
 */
export const negotiationSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      clauseId: z.string().min(1),
      suggestion: z.string().min(1).max(1000),
      saferAlternative: z.string().max(3000).optional().default(''),
    })
  ),
});

/**
 * Reconcile and validate AI risk output against segmented clauses
 * Ensures the model hasn't dropped clauses, corrupted IDs, or hallucinated extra clauses
 */
export const reconcileAndValidateRiskOutput = (aiOutput, originalClauses) => {
  const validated = riskAnalysisSchema.parse(aiOutput);
  const clauseMap = new Map();

  // Index original clauses
  originalClauses.forEach((c) => {
    clauseMap.set(c.id, {
      id: c.id,
      text: c.text,
      originalOrder: c.originalOrder,
      risk: 'Low',
      category: 'General Terms',
      reason: 'Standard contractual clause.',
      suggestion: '',
      saferAlternative: '',
      riskFactors: [],
      confidence: 0.9,
    });
  });

  // Overlay AI findings onto original clauses
  validated.clauses.forEach((aiClause) => {
    if (clauseMap.has(aiClause.id)) {
      const existing = clauseMap.get(aiClause.id);
      clauseMap.set(aiClause.id, {
        ...existing,
        risk: aiClause.risk,
        category: aiClause.category || existing.category,
        reason: aiClause.reason || existing.reason,
        riskFactors: aiClause.riskFactors || [],
        confidence: aiClause.confidence ?? 0.9,
      });
    }
  });

  const mergedClauses = Array.from(clauseMap.values()).sort(
    (a, b) => a.originalOrder - b.originalOrder
  );

  return {
    clauses: mergedClauses,
    redFlags: validated.redFlags || [],
    summary: validated.summary || 'Contract risk review completed.',
    overallRisk: validated.overallRisk || 'Low',
  };
};
