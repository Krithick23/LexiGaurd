import {
  classifyContractWithGemini,
  segmentClausesWithGemini,
  scoreRiskWithGemini,
  generateNegotiationSuggestionsWithGemini,
} from './geminiService.js';

/**
 * Three-Stage AI Contract Analysis Pipeline
 * Stage 1: Contract Classification & Clause Segmentation
 * Stage 2: Role-Specific Risk Analysis & Missing Provisions Detection
 * Stage 3: Practical Negotiation Suggestions & Draft Alternatives
 */
export async function analyzeContractPipeline(rawText, userRole = 'freelancer') {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new Error('Contract text is empty or invalid.');
  }

  // 1A. Contract Classification
  const classification = await classifyContractWithGemini(rawText, userRole);

  // 1B. Clause Segmentation
  const segmented = await segmentClausesWithGemini(rawText);
  if (!segmented || segmented.length === 0) {
    throw new Error('Failed to segment contract into clauses.');
  }

  // 2. Role-Specific Risk Scoring & Missing Provisions Detection
  const riskAnalysis = await scoreRiskWithGemini(segmented, userRole, classification);

  // 3. Negotiation Suggestions for Critical, High, and Medium risk clauses
  const riskyClauses = riskAnalysis.clauses.filter(
    (c) => c.risk === 'Critical' || c.risk === 'High' || c.risk === 'Medium'
  );

  let suggestions = [];
  if (riskyClauses.length > 0) {
    suggestions = await generateNegotiationSuggestionsWithGemini(
      riskyClauses,
      userRole,
      classification.documentType
    );
  }

  // Merge suggestions into clauses
  const suggestionMap = new Map();
  suggestions.forEach((s) => {
    suggestionMap.set(s.clauseId, s);
  });

  const enrichedClauses = riskAnalysis.clauses.map((clause) => {
    const s = suggestionMap.get(clause.id);
    return {
      ...clause,
      suggestion: s?.suggestion || s?.negotiate || clause.suggestion || '',
      saferAlternative: s?.saferAlternative || s?.alternativeWording || clause.saferAlternative || '',
      negotiation: {
        clarify: s?.clarify || clause.negotiation?.clarify || '',
        negotiate: s?.negotiate || s?.suggestion || clause.negotiation?.negotiate || clause.suggestion || '',
        why: s?.why || clause.negotiation?.why || clause.whyItMatters || '',
        alternativeWording: s?.alternativeWording || s?.saferAlternative || clause.negotiation?.alternativeWording || clause.saferAlternative || '',
        priority: s?.priority || clause.negotiation?.priority || (clause.risk === 'Critical' ? 'Critical' : clause.risk === 'High' ? 'High' : 'Medium'),
        recommendLegalReview: s?.recommendLegalReview ?? clause.negotiation?.recommendLegalReview ?? (clause.risk === 'Critical' || clause.risk === 'High'),
      },
    };
  });

  return {
    clauses: enrichedClauses,
    redFlags: riskAnalysis.redFlags || [],
    missingClauses: riskAnalysis.missingClauses || [],
    summary: riskAnalysis.summary || 'Contract risk review completed.',
    overallRisk: riskAnalysis.overallRisk || 'Low',
    overallRiskScore: riskAnalysis.overallRiskScore ?? 25,
    riskDistribution: riskAnalysis.riskDistribution || {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    },
    detectedContractType: classification.documentType || 'General Agreement',
    contractClassification: classification,
    analysisLimitations:
      riskAnalysis.analysisLimitations ||
      'LexiGuard provides automated informational analysis and does not constitute formal legal counsel.',
    modelUsed: process.env.GEMINI_API_KEY ? 'gemini-1.5-flash' : 'lexiguard-heuristics-v2',
    analysisVersion: '2.0.0',
  };
}
