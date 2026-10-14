import { generateNegotiationSuggestionsWithGemini } from './geminiService.js';

export async function generateNegotiationAdvice(riskyClauses, userRole = 'freelancer') {
  return generateNegotiationSuggestionsWithGemini(riskyClauses, userRole);
}

export default generateNegotiationAdvice;
