import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  buildClassificationPrompt,
  buildSegmentPrompt,
  buildRiskPrompt,
  buildNegotiatePrompt,
} from '../prompts/geminiPrompts.js';
import {
  extractAndParseJSON,
  classificationSchema,
  segmentedClausesSchema,
  reconcileAndValidateRiskOutput,
  negotiationSuggestionsSchema,
} from '../utils/validateAIOutput.js';
import {
  classifyContractDeterministically,
  runFallbackAnalysis,
} from './fallbackAnalysis.js';
import { segmentClausesDeterministically } from './segmentClauses.js';

let genAI = null;

function getGenAI() {
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_WITH_LIVE_GEMINI) {
    return null;
  }
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
  if (!apiKey) return null;
  if (!genAI) {
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('[AI Service] Google Gemini API client initialized successfully.');
    } catch (initErr) {
      console.warn(`[AI Service] Warning: Gemini API init error: ${initErr.message}`);
    }
  }
  return genAI;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Robust call wrapper with exponential backoff retry
 */
async function callGeminiWithRetry(
  prompt,
  modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  maxRetries = 2
) {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('Gemini API is not configured or disabled.');
  }

  const model = ai.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2, // Low temperature for factual, analytical consistency
      topP: 0.8,
      responseMimeType: 'application/json',
    },
  });

  let attempt = 0;
  let delay = 1500;

  while (attempt <= maxRetries) {
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timed out after 30 seconds')), 30000)
        ),
      ]);

      const response = await result.response;
      return response.text();
    } catch (err) {
      attempt++;
      console.warn(`[Gemini API] Attempt ${attempt} failed: ${err.message}`);
      if (attempt > maxRetries) {
        throw err;
      }
      await sleep(delay);
      delay *= 2;
    }
  }
}

/**
 * Stage 1A: Classify contract type & parties using Gemini (with deterministic fallback)
 */
export async function classifyContractWithGemini(rawContractText, role = 'freelancer') {
  if (!getGenAI()) {
    return classifyContractDeterministically(rawContractText, role);
  }

  try {
    const prompt = buildClassificationPrompt(rawContractText, role);
    const rawOutput = await callGeminiWithRetry(prompt);
    const parsed = extractAndParseJSON(rawOutput);
    return classificationSchema.parse(parsed);
  } catch (err) {
    console.warn(`[AI Classification] Fallback to deterministic classification: ${err.message}`);
    return classifyContractDeterministically(rawContractText, role);
  }
}

/**
 * Stage 1B: Segment clauses using Gemini (with deterministic fallback)
 */
export async function segmentClausesWithGemini(rawContractText) {
  // First, get deterministic baseline
  const deterministicClauses = segmentClausesDeterministically(rawContractText);

  if (!getGenAI() || deterministicClauses.length >= 3) {
    // If deterministic parsing found solid section structure, use it for speed & precision
    return deterministicClauses;
  }

  try {
    const prompt = buildSegmentPrompt(rawContractText);
    const rawOutput = await callGeminiWithRetry(prompt);
    const parsed = extractAndParseJSON(rawOutput);
    const validated = segmentedClausesSchema.parse(parsed);

    return validated.clauses.map((c, index) => ({
      id: c.id || `clause-${index + 1}`,
      text: c.text,
      originalOrder: index + 1,
    }));
  } catch (err) {
    console.warn(`[AI Segmentation] Fallback to deterministic segmentation: ${err.message}`);
    return deterministicClauses;
  }
}

/**
 * Stage 2: Risk Scoring with Gemini (with fallback)
 */
export async function scoreRiskWithGemini(clauses, role = 'freelancer', classification = {}) {
  if (!getGenAI()) {
    return runFallbackAnalysis(clauses, role, classification);
  }

  try {
    const prompt = buildRiskPrompt(clauses, role, classification);
    const rawOutput = await callGeminiWithRetry(prompt);
    const parsed = extractAndParseJSON(rawOutput);
    return reconcileAndValidateRiskOutput(parsed, clauses);
  } catch (err) {
    console.warn(`[AI Risk Scoring] Falling back to deterministic heuristics: ${err.message}`);
    return runFallbackAnalysis(clauses, role, classification);
  }
}

/**
 * Stage 3: Generate Negotiation Suggestions with Gemini (with fallback)
 */
export async function generateNegotiationSuggestionsWithGemini(
  riskyClauses,
  role = 'freelancer',
  documentType = 'Agreement'
) {
  if (!riskyClauses || riskyClauses.length === 0) {
    return [];
  }

  if (!getGenAI()) {
    // Return existing suggestions from fallback analysis
    return riskyClauses.map((c) => ({
      clauseId: c.id,
      clarify: c.negotiation?.clarify || `Clarify terms and obligations for ${c.title || 'this clause'}.`,
      negotiate: c.suggestion || 'Request reasonable, mutual terms standard in Indian contracting.',
      why: c.whyItMatters || 'Protects your legal and financial position under this contract.',
      alternativeWording: c.saferAlternative || '',
      suggestion: c.suggestion || '',
      saferAlternative: c.saferAlternative || '',
      priority: c.risk === 'Critical' ? 'Critical' : c.risk === 'High' ? 'High' : 'Medium',
      recommendLegalReview: c.risk === 'Critical' || c.risk === 'High',
    }));
  }

  try {
    const prompt = buildNegotiatePrompt(riskyClauses, role, documentType);
    const rawOutput = await callGeminiWithRetry(prompt);
    const parsed = extractAndParseJSON(rawOutput);
    const validated = negotiationSuggestionsSchema.parse(parsed);
    return validated.suggestions;
  } catch (err) {
    console.warn(`[AI Negotiation] Falling back to default suggestions: ${err.message}`);
    return riskyClauses.map((c) => ({
      clauseId: c.id,
      clarify: c.negotiation?.clarify || `Clarify scope and commitments under ${c.title || 'this clause'}.`,
      negotiate: c.suggestion || 'Clarify scope, mutual caps on liability, and fair payment schedule in writing.',
      why: c.whyItMatters || 'Crucial protection for your registered perspective.',
      alternativeWording: c.saferAlternative || '',
      suggestion: c.suggestion || '',
      saferAlternative: c.saferAlternative || '',
      priority: c.risk === 'Critical' ? 'Critical' : c.risk === 'High' ? 'High' : 'Medium',
      recommendLegalReview: c.risk === 'Critical' || c.risk === 'High',
    }));
  }
}
