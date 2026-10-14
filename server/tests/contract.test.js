import { describe, it, expect } from 'vitest';
import { segmentClausesDeterministically } from '../services/segmentClauses.js';
import { compareContractAnalyses } from '../services/compareContracts.js';
import { runFallbackAnalysis } from '../services/fallbackAnalysis.js';

describe('Clause Segmentation Service', () => {
  it('should segment numbered clauses accurately', () => {
    const text = `
    AGREEMENT
    1. SCOPE OF WORK: Developer agrees to create mobile app.
    2. PAYMENT TERMS: Client pays INR 50,000 on completion.
    3. TERMINATION: Either party may terminate with 30 days notice.
    `;
    const clauses = segmentClausesDeterministically(text);
    expect(clauses.length).toBeGreaterThanOrEqual(3);
    const scopeClause = clauses.find((c) => c.text.includes('Developer agrees to create mobile app'));
    expect(scopeClause).toBeDefined();
    const paymentClause = clauses.find((c) => c.text.includes('Client pays INR 50,000'));
    expect(paymentClause).toBeDefined();
  });

  it('should fall back gracefully to paragraph breaks if no numbers exist', () => {
    const text = `The contractor shall deliver code on Friday.\n\nThe client shall approve the code in 7 days.\n\nAll disputes shall be resolved in Bengaluru.`;
    const clauses = segmentClausesDeterministically(text);
    expect(clauses.length).toBe(3);
  });
});

describe('Risk Analysis Heuristics', () => {
  it('should identify a 36-month non-compete as Critical or High Risk for Indian freelancers', () => {
    const clauses = [
      {
        id: 'clause-1',
        text: 'Contractor shall not engage in or consult for any software entity in India for 36 months after termination.',
        originalOrder: 1,
      },
    ];
    const result = runFallbackAnalysis(clauses, 'freelancer');
    expect(['Critical', 'High']).toContain(result.overallRisk);
    expect(['Critical', 'High']).toContain(result.clauses[0].risk);
    expect(result.clauses[0].reason).toContain('Section 27');
    expect(result.clauses[0].suggestion).toBeDefined();
  });

  it('should identify Net-90 with arbitrary withholding as Critical or High Risk', () => {
    const clauses = [
      {
        id: 'clause-1',
        text: 'Payment will be made within 90 days after subjective approval of invoice. Company reserves right to withhold or forfeit payment.',
        originalOrder: 1,
      },
    ];
    const result = runFallbackAnalysis(clauses, 'freelancer');
    expect(['Critical', 'High']).toContain(result.clauses[0].risk);
  });
});

describe('Contract Comparison Service', () => {
  it('should detect resolved risks when toxic non-compete is struck or modified', () => {
    const origContract = {
      _id: '1',
      fileName: 'Draft1.docx',
      clauses: [
        {
          id: 'c1',
          text: 'Contractor shall not work with any competitor for 36 months post-termination.',
          risk: 'High',
          category: 'Non-Compete & Exclusivity',
        },
      ],
    };

    const revisedContract = {
      _id: '2',
      fileName: 'Draft2.docx',
      clauses: [
        {
          id: 'c1-rev',
          text: 'Contractor agrees not to solicit active clients during the term of this agreement.',
          risk: 'Low',
          category: 'Non-Compete & Exclusivity',
        },
      ],
    };

    const diff = compareContractAnalyses(origContract, revisedContract);
    expect(diff.metrics).toBeDefined();
    expect(diff.contractOriginal.fileName).toBe('Draft1.docx');
    expect(diff.contractRevised.fileName).toBe('Draft2.docx');
  });
});
