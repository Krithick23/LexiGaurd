import {
  segmentClausesWithGemini,
  scoreRiskWithGemini,
  generateNegotiationSuggestionsWithGemini,
} from './geminiService.js';

/**
 * Full AI Contract Analysis Pipeline
 * Step 1: Segment clauses
 * Step 2: Score risk & detect red flags
 * Step 3: Generate negotiation suggestions & safer alternatives for risky clauses
 */
export async function analyzeContractPipeline(rawText, userRole = 'freelancer') {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new Error('Contract text is empty or invalid.');
  }

  // 1. Segmentation
  const segmented = await segmentClausesWithGemini(rawText);
  if (!segmented || segmented.length === 0) {
    throw new Error('Failed to segment contract into clauses.');
  }

  // 2. Risk scoring & red flags
  const riskAnalysis = await scoreRiskWithGemini(segmented, userRole);

  // 3. Filter Medium and High risk clauses for negotiation suggestions
  const riskyClauses = riskAnalysis.clauses.filter(
    (c) => c.risk === 'High' || c.risk === 'Medium'
  );

  let suggestions = [];
  if (riskyClauses.length > 0) {
    suggestions = await generateNegotiationSuggestionsWithGemini(riskyClauses, userRole);
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
      suggestion: s?.suggestion || clause.suggestion || '',
      saferAlternative: s?.saferAlternative || clause.saferAlternative || '',
    };
  });

  return {
    clauses: enrichedClauses,
    redFlags: riskAnalysis.redFlags || [],
    summary: riskAnalysis.summary || 'Contract risk review completed.',
    overallRisk: riskAnalysis.overallRisk || 'Low',
    modelUsed: process.env.GEMINI_API_KEY ? 'gemini-1.5-flash' : 'lexiguard-heuristics-v1',
    analysisVersion: '1.0.0',
  };
}
