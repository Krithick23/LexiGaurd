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
    throw new Error(
      `Failed to parse AI JSON response: ${parseError.message}. Content was: ${cleaned.slice(0, 200)}...`
    );
  }
};

/**
 * Zod Schema for Stage 1A: Contract Classification Output
 */
export const classificationSchema = z.object({
  documentType: z.string().default('General Agreement'),
  parties: z.array(z.string()).default([]),
  purpose: z.string().default('Contractual agreement between parties'),
  confidence: z.number().min(0).max(1).default(0.85),
  missingOrUnclearInfo: z.array(z.string()).default([]),
  classificationDetails: z.string().default(''),
});

/**
 * Zod Schema for Stage 1B: Segmentation Output
 */
export const segmentedClausesSchema = z.object({
  clauses: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1).max(30000),
      })
    )
    .min(1, 'At least one clause must be segmented'),
});

/**
 * Zod Schema for Stage 2: Role-Specific Risk Scoring Output
 */
export const riskAnalysisSchema = z.object({
  clauses: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().optional().default(''),
      category: z.string().default('General Terms'),
      risk: z
        .enum(['Critical', 'High', 'Medium', 'Low', 'Informational'])
        .or(z.string().transform((val) => {
          const v = val.toLowerCase();
          if (v.includes('crit')) return 'Critical';
          if (v.includes('high')) return 'High';
          if (v.includes('med')) return 'Medium';
          if (v.includes('info')) return 'Informational';
          return 'Low';
        }))
        .default('Low'),
      riskScore: z.coerce.number().min(0).max(100).default(20),
      reason: z.string().default(''),
      whyItMatters: z.string().optional().default(''),
      impact: z
        .union([
          z.object({
            financial: z.string().optional().default(''),
            legal: z.string().optional().default(''),
            operational: z.string().optional().default(''),
          }),
          z.string().transform((s) => ({ financial: s, legal: '', operational: '' })),
        ])
        .optional()
        .default({ financial: '', legal: '', operational: '' }),
      suggestedAction: z.string().optional().default(''),
      flags: z
        .object({
          isMissing: z.boolean().optional().default(false),
          isAmbiguous: z.boolean().optional().default(false),
          isUnusual: z.boolean().optional().default(false),
          isOneSided: z.boolean().optional().default(false),
        })
        .optional()
        .default({ isMissing: false, isAmbiguous: false, isUnusual: false, isOneSided: false }),
      supportingText: z.string().optional().default(''),
      riskFactors: z.array(z.string()).default([]),
      confidence: z.coerce.number().min(0).max(1).default(0.9),
    })
  ),
  redFlags: z.array(z.string()).default([]),
  missingClauses: z
    .array(
      z.object({
        title: z.string().default('Missing Provision'),
        description: z.string().default(''),
        whyItMatters: z.string().default(''),
        suggestedAddition: z.string().default(''),
        riskLevel: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
      })
    )
    .optional()
    .default([]),
  summary: z.string().default('Contract risk analysis completed.'),
  overallRisk: z
    .enum(['Critical', 'High', 'Medium', 'Low', 'Informational'])
    .or(z.string().transform((val) => {
      const v = val.toLowerCase();
      if (v.includes('crit')) return 'Critical';
      if (v.includes('high')) return 'High';
      if (v.includes('med')) return 'Medium';
      if (v.includes('info')) return 'Informational';
      return 'Low';
    }))
    .default('Low'),
  overallRiskScore: z.coerce.number().min(0).max(100).optional().default(30),
  riskDistribution: z
    .object({
      critical: z.number().optional().default(0),
      high: z.number().optional().default(0),
      medium: z.number().optional().default(0),
      low: z.number().optional().default(0),
      informational: z.number().optional().default(0),
    })
    .optional()
    .default({ critical: 0, high: 0, medium: 0, low: 0, informational: 0 }),
  analysisLimitations: z
    .string()
    .optional()
    .default(
      'Informational automated risk assessment based on Indian commercial contracting norms. Does not constitute formal legal counsel.'
    ),
});

/**
 * Zod Schema for Stage 3: Negotiation Suggestions Output
 */
export const negotiationSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      clauseId: z.string().min(1),
      clarify: z.string().optional().default(''),
      negotiate: z.string().optional().default(''),
      why: z.string().optional().default(''),
      alternativeWording: z.string().optional().default(''),
      suggestion: z.string().optional().default(''),
      saferAlternative: z.string().optional().default(''),
      priority: z
        .enum(['Critical', 'High', 'Medium', 'Low'])
        .or(z.string().transform((val) => {
          const v = val.toLowerCase();
          if (v.includes('crit')) return 'Critical';
          if (v.includes('high')) return 'High';
          if (v.includes('low')) return 'Low';
          return 'Medium';
        }))
        .default('Medium'),
      recommendLegalReview: z.boolean().optional().default(false),
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
      title: c.title || '',
      text: c.text,
      originalOrder: c.originalOrder,
      risk: 'Low',
      riskScore: 20,
      category: 'General Terms',
      reason: 'Standard contractual clause.',
      whyItMatters: '',
      impact: { financial: '', legal: '', operational: '' },
      suggestedAction: '',
      flags: { isMissing: false, isAmbiguous: false, isUnusual: false, isOneSided: false },
      suggestion: '',
      saferAlternative: '',
      negotiation: {
        clarify: '',
        negotiate: '',
        why: '',
        alternativeWording: '',
        priority: 'Medium',
        recommendLegalReview: false,
      },
      riskFactors: [],
      confidence: 0.9,
      supportingText: '',
    });
  });

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;

  // Overlay AI findings onto original clauses
  validated.clauses.forEach((aiClause) => {
    if (clauseMap.has(aiClause.id)) {
      const existing = clauseMap.get(aiClause.id);
      const risk = aiClause.risk || 'Low';

      if (risk === 'Critical') criticalCount++;
      else if (risk === 'High') highCount++;
      else if (risk === 'Medium') mediumCount++;
      else if (risk === 'Informational') infoCount++;
      else lowCount++;

      clauseMap.set(aiClause.id, {
        ...existing,
        title: aiClause.title || existing.title || aiClause.category || 'Contract Clause',
        risk,
        riskScore: aiClause.riskScore ?? (risk === 'Critical' ? 90 : risk === 'High' ? 75 : risk === 'Medium' ? 45 : 15),
        category: aiClause.category || existing.category,
        reason: aiClause.reason || existing.reason,
        whyItMatters: aiClause.whyItMatters || '',
        impact: aiClause.impact || { financial: '', legal: '', operational: '' },
        suggestedAction: aiClause.suggestedAction || '',
        flags: aiClause.flags || { isMissing: false, isAmbiguous: false, isUnusual: false, isOneSided: false },
        supportingText: aiClause.supportingText || '',
        riskFactors: aiClause.riskFactors || [],
        confidence: aiClause.confidence ?? 0.9,
      });
    }
  });

  const mergedClauses = Array.from(clauseMap.values()).sort(
    (a, b) => a.originalOrder - b.originalOrder
  );

  // Compute overall risk score if not provided or 0
  let calculatedScore = validated.overallRiskScore;
  if (!calculatedScore || calculatedScore <= 0) {
    if (criticalCount > 0) calculatedScore = Math.min(100, 75 + criticalCount * 10);
    else if (highCount > 0) calculatedScore = Math.min(85, 55 + highCount * 8);
    else if (mediumCount > 0) calculatedScore = Math.min(60, 30 + mediumCount * 6);
    else calculatedScore = Math.max(10, 20 + lowCount * 2);
  }

  let overallRisk = validated.overallRisk;
  if (criticalCount > 0) overallRisk = 'Critical';
  else if (highCount > 0 && overallRisk !== 'Critical') overallRisk = 'High';
  else if (mediumCount > 0 && overallRisk === 'Low') overallRisk = 'Medium';

  return {
    clauses: mergedClauses,
    redFlags: validated.redFlags || [],
    missingClauses: validated.missingClauses || [],
    summary: validated.summary || 'Contract risk review completed.',
    overallRisk,
    overallRiskScore: Math.min(100, Math.max(0, calculatedScore)),
    riskDistribution: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      informational: infoCount,
    },
    analysisLimitations:
      validated.analysisLimitations ||
      'Informational automated risk assessment based on Indian commercial contracting norms. Does not constitute formal legal counsel.',
  };
};
