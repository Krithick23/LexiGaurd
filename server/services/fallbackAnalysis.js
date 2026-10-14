/**
 * LexiGuard Fallback Deterministic Contract Analysis Engine
 * Expertly calibrated for Indian Freelancers, Employees, and Small Business Founders.
 * Evaluates contractual clauses against Indian legal standards (e.g. Section 27 Indian Contract Act 1872,
 * Indian Copyright Act 1957, limitation of liability standards, and fair commercial practices).
 */

const RISK_RULES = [
  // 1. NON-COMPETE & EXCLUSIVITY
  {
    category: 'Non-Compete & Exclusivity',
    keywords: [
      /non-compete/i,
      /not\s+(?:directly\s+or\s+indirectly\s+)?(?:engage|consult|work|compete)/i,
      /restraint\s+of\s+trade/i,
      /exclusivity/i,
      /solely\s+and\s+exclusively/i,
      /post-termination\s+restriction/i,
      /36\s+months|24\s+months|12\s+months.*compete/i,
    ],
    detectRisk: (text, role) => {
      const isPostTermination = /(?:after|following|upon)\s+(?:termination|expiry)/i.test(text) ||
        /(?:12|24|36)\s+months/i.test(text);
      const isBroadSector = /any\s+business|any\s+client|any\s+entity|sector|industry/i.test(text);

      if (isPostTermination || isBroadSector) {
        return {
          risk: 'High',
          reason: 'Imposes severe post-contract restrictions on your right to work or take other clients. Note that post-termination non-compete agreements in employment/contracting are generally void under Section 27 of the Indian Contract Act, 1872, but clients may still use them to intimidate you.',
          riskFactors: ['Broad Non-Compete', 'Post-Termination Restraint', 'Section 27 Conflict'],
          suggestion: 'Propose striking the post-termination non-compete entirely, replacing it with a reasonable non-solicitation of direct client contacts during the active project term only.',
          saferAlternative: 'Contractor agrees not to directly solicit Company’s active clients for whom Contractor performed direct services, during the term of this Agreement and for three (3) months thereafter. Contractor retains full freedom to provide services to any other non-conflicting clients.',
        };
      }

      return {
        risk: 'Medium',
        reason: 'Contains exclusivity constraints that may restrict your ability to work on side projects or service other concurrent clients.',
        riskFactors: ['Exclusivity Restriction'],
        suggestion: 'Clarify that exclusivity applies only to direct competitors on substantially similar active project deliverables.',
        saferAlternative: 'Contractor agrees not to provide direct consulting services to immediate named competitors of Company on the specific project scope during the active Statement of Work.',
      };
    },
  },

  // 2. INTELLECTUAL PROPERTY & MORAL RIGHTS
  {
    category: 'Intellectual Property',
    keywords: [
      /intellectual\s+property/i,
      /assign(?:s|ment)?\s+(?:all\s+)?(?:right|title|interest)/i,
      /moral\s+rights/i,
      /work\s+made\s+for\s+hire/i,
      /irrevocably\s+waives?/i,
      /pre-existing/i,
      /background\s+ip/i,
      /inventions/i,
    ],
    detectRisk: (text, role) => {
      const assignsPriorWork = /side\s+project|prior\s+open[- ]source|pre-existing|background/i.test(text);
      const beforePayment = /prior\s+to\s+payment|irrespective\s+of\s+.*payment|immediately\s+upon\s+creation/i.test(text);
      const moralRightsWaiver = /moral\s+rights|attribution/i.test(text);

      if (assignsPriorWork || beforePayment) {
        return {
          risk: 'High',
          reason: 'Demands transfer of IP ownership before full payment is disbursed, or captures your pre-existing tools, side projects, and open-source contributions.',
          riskFactors: ['Pre-Payment IP Transfer', 'Overbroad IP Assignment', 'Moral Rights Waiver'],
          suggestion: 'Insist that IP ownership transfers strictly upon full and final payment of all corresponding invoices, and explicitly carve out your pre-existing developer libraries.',
          saferAlternative: 'Upon receipt of full and final payment for the applicable deliverables, Contractor transfers to Company all right and title in the bespoke deliverables created specifically for Company. Contractor retains all ownership of pre-existing background code and tools.',
        };
      }

      if (moralRightsWaiver) {
        return {
          risk: 'Medium',
          reason: 'Requires irrevocable waiver of moral rights and attribution under the Indian Copyright Act, 1957.',
          riskFactors: ['Moral Rights Waiver'],
          suggestion: 'Request portfolio attribution rights to showcase non-confidential project screenshots.',
          saferAlternative: 'Contractor may showcase public, non-confidential screenshots and descriptions of the completed project in Contractor’s professional portfolio.',
        };
      }

      return {
        risk: 'Medium',
        reason: 'Assigns intellectual property without clearly separating custom deliverables from reusable background tools.',
        riskFactors: ['Ambiguous IP Scope'],
        suggestion: 'Specify that assignment covers only custom deliverables created specifically under this contract.',
        saferAlternative: 'Company shall own custom deliverables created solely for Company under an executed Statement of Work.',
      };
    },
  },

  // 3. PAYMENT TERMS, HOLDBACKS & DEDUCTIONS
  {
    category: 'Payment Terms',
    keywords: [
      /payment\s+terms/i,
      /invoice/i,
      /disburs/i,
      /withhold|forfeit|deduct/i,
      /subjective\s+satisfaction|sole\s+discretion/i,
      /60\s+days|90\s+days|120\s+days/i,
      /compensat/i,
    ],
    detectRisk: (text, role) => {
      const longPaymentWindow = /60\s+days|90\s+days|120\s+days/i.test(text);
      const arbitraryWithholding = /withhold|forfeit|sole\s+discretion|dissatisfied/i.test(text);

      if (longPaymentWindow || arbitraryWithholding) {
        return {
          risk: 'High',
          reason: 'Contains predatory payment terms: excessive payment delay (60–90+ days) or unilateral authority for the client to withhold, discount, or forfeit your earnings on subjective grounds.',
          riskFactors: ['Excessive Payment Delay', 'Unilateral Payment Forfeiture', 'Uncapped Payment Terms'],
          suggestion: 'Counter with Net-15 or Net-30 payment terms, and require objective milestone acceptance criteria rather than subjective satisfaction.',
          saferAlternative: 'Client shall review deliverables within seven (7) business days of receipt against the agreed specifications. Payment shall be made within fifteen (15) days of undisputed invoice submission. Invoices not disputed in writing within 7 days shall be deemed accepted.',
        };
      }

      if (/net\s*45/i.test(text)) {
        return {
          risk: 'Medium',
          reason: '45-day payment cycle causes cash-flow strain for freelancers and independent professionals.',
          riskFactors: ['Net-45 Payment Window'],
          suggestion: 'Request Net-15 or Net-30 days standard commercial terms with late interest for overdue balances.',
          saferAlternative: 'Invoices are payable within twenty (20) days of receipt. Late payments shall accrue interest at 1.5% per month.',
        };
      }

      return {
        risk: 'Low',
        reason: 'Payment provisions appear customary with defined disbursement timelines.',
        riskFactors: ['Standard Payment Schedule'],
        suggestion: 'Ensure invoice submission protocols and bank account details are agreed in writing.',
        saferAlternative: '',
      };
    },
  },

  // 4. TERMINATION & PENALTIES
  {
    category: 'Termination & Penalties',
    keywords: [
      /terminat/i,
      /with\s+or\s+without\s+cause/i,
      /liquidated\s+damages/i,
      /penalty|penalties/i,
      /notice\s+period/i,
      /exit\s+fee/i,
    ],
    detectRisk: (text, role) => {
      const asymmetricNotice = /company\s+may\s+terminate\s+immediately.*(?:contractor|employee)\s+may\s+terminate.*(?:60|90)\s+days/is.test(text) ||
        /(?:penalty|liquidated\s+damages)\s+of\s+inr/i.test(text);

      if (asymmetricNotice || /liquidated\s+damages/i.test(text)) {
        return {
          risk: 'High',
          reason: 'Highly asymmetric termination rights: the client can terminate instantly without cause, while you face a lengthy notice period or punitive monetary damages upon early departure.',
          riskFactors: ['Asymmetric Termination', 'Liquidated Damages Penalty', 'Exit Bond'],
          suggestion: 'Negotiate mutual termination rights with equal notice periods (14–30 days) and remove any liquidated damages penalties.',
          saferAlternative: 'Either party may terminate this Agreement without cause upon thirty (30) days prior written notice, or immediately upon written notice in the event of an uncured material breach following a 14-day cure period. Client shall pay for all work completed up to the termination date.',
        };
      }

      if (/immediately.*without\s+cause/i.test(text)) {
        return {
          risk: 'Medium',
          reason: 'Client reserves the right to terminate without notice or cause, leaving you with unpaid billable hours.',
          riskFactors: ['Unilateral Immediate Termination'],
          suggestion: 'Require at least 14 days written notice for convenience with payment for work-in-progress.',
          saferAlternative: 'Either party may terminate for convenience upon fourteen (14) days prior written notice.',
        };
      }

      return {
        risk: 'Low',
        reason: 'Termination provisions include mutual rights and standard notice periods.',
        riskFactors: ['Mutual Termination'],
        suggestion: 'Confirm that all accrued fees are payable upon termination.',
        saferAlternative: '',
      };
    },
  },

  // 5. INDEMNITY & UNLIMITED LIABILITY
  {
    category: 'Indemnity & Liability',
    keywords: [
      /indemnif/i,
      /hold\s+harmless/i,
      /liability/i,
      /uncapped|unlimited/i,
      /consequential\s+damages/i,
      /third-party\s+claims/i,
      /maximum\s+liability.*not\s+exceed/i,
    ],
    detectRisk: (text, role) => {
      const unlimitedLiability = /uncapped|unlimited\s+liability|regardless\s+of\s+cause/i.test(text);
      const lopsidedCap = /company.*maximum\s+liability.*(?:inr\s*1,?000|\$100)/i.test(text) &&
        /contractor.*liability.*unlimited/i.test(text);

      if (unlimitedLiability || lopsidedCap) {
        return {
          risk: 'High',
          reason: 'Imposes uncapped, unlimited liability on you for any third-party claims, while capping the client’s liability to a nominal amount. This could financially ruin an individual contractor or small firm.',
          riskFactors: ['Unlimited Contractor Liability', 'Lopsided Liability Cap', 'Broad Indemnification'],
          suggestion: 'Insist on mutual limitation of liability capped at total fees paid under the contract, and exclude indirect or consequential damages.',
          saferAlternative: 'Except for gross negligence or willful misconduct, each party’s aggregate liability arising under this Agreement shall be limited to the total fees paid by Client to Contractor in the preceding six (6) months. Neither party shall be liable for indirect or consequential damages.',
        };
      }

      if (/indemnif/i.test(text) && !/mutual/i.test(text)) {
        return {
          risk: 'Medium',
          reason: 'One-sided indemnification obligation where only you are protecting the company, not vice-versa.',
          riskFactors: ['One-Sided Indemnification'],
          suggestion: 'Make indemnification mutual and restrict it to direct damages caused by gross negligence or proven IP infringement.',
          saferAlternative: 'Each party agrees to mutually indemnify the other against direct third-party claims resulting from willful misconduct or direct infringement of intellectual property.',
        };
      }

      return {
        risk: 'Low',
        reason: 'Liability and indemnification terms appear balanced or capped.',
        riskFactors: ['Capped Liability'],
        suggestion: 'Verify that any liability cap covers both parties equally.',
        saferAlternative: '',
      };
    },
  },

  // 6. SCOPE CREEP & UNILATERAL CHANGES
  {
    category: 'Scope of Work',
    keywords: [
      /scope\s+of\s+(?:work|services)/i,
      /deliverables/i,
      /unilateral|at\s+any\s+time/i,
      /alter|modify|expand/i,
      /without.*compensation/i,
      /subjective\s+perfection/i,
    ],
    detectRisk: (text, role) => {
      if (/alter|modify|expand/i.test(text) && /without.*(?:compensation|adjustment)/i.test(text)) {
        return {
          risk: 'High',
          reason: 'Allows the client to unilaterally alter or expand project deliverables and deadlines without paying additional fees or adjusting delivery schedules (extreme scope creep).',
          riskFactors: ['Uncompensated Scope Creep', 'Unilateral Deliverable Modification'],
          suggestion: 'Require all scope changes to be documented in a written Change Order signed by both parties with commensurate fee and schedule revisions.',
          saferAlternative: 'Any changes to the scope of services, deliverables, or timelines must be agreed upon in writing by both parties via a formal Change Order specifying applicable additional fees and adjusted deadlines.',
        };
      }

      return {
        risk: 'Medium',
        reason: 'Deliverable acceptance criteria or scope boundaries are not strictly defined, risking dispute over project completion.',
        riskFactors: ['Ambiguous Acceptance Criteria'],
        suggestion: 'Attach an explicit Statement of Work with objective pass/fail acceptance milestones.',
        saferAlternative: 'Deliverables shall be deemed accepted if no written defect notice is received within ten (10) business days following delivery.',
      };
    },
  },

  // 7. GOVERNING LAW & DISPUTE RESOLUTION
  {
    category: 'Dispute Resolution',
    keywords: [
      /governing\s+law/i,
      /jurisdiction/i,
      /courts?\s+of/i,
      /delaware|california|new\s+york|england|singapore/i,
      /arbitration/i,
      /bear\s+all\s+(?:legal\s+)?expenses/i,
    ],
    detectRisk: (text, role) => {
      const foreignJurisdiction = /delaware|california|new\s+york|england|london/i.test(text);
      const isIndianUser = true;

      if (foreignJurisdiction && isIndianUser) {
        return {
          risk: 'High',
          reason: 'Designates a foreign jurisdiction (e.g. Delaware, US or UK) for dispute resolution. If a payment dispute arises, an Indian freelancer or small business cannot afford overseas litigation.',
          riskFactors: ['Foreign Jurisdiction Trap', 'Costly Cross-Border Dispute Venue'],
          suggestion: 'Negotiate governing law and jurisdiction to India, or propose virtual international arbitration (e.g., SIAC or ICC) with mutual fee sharing.',
          saferAlternative: 'This Agreement shall be governed by the laws of India. Any dispute arising out of or in connection with this Agreement shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996, conducted virtually or in Mumbai/Bangalore.',
        };
      }

      return {
        risk: 'Low',
        reason: 'Governing law is standard Indian law or balanced mutual arbitration.',
        riskFactors: ['Domestic Jurisdiction'],
        suggestion: 'Ensure the court venue is located in a mutually convenient city.',
        saferAlternative: '',
      };
    },
  },

  // 8. CONFIDENTIALITY & NON-DISPARAGEMENT
  {
    category: 'Confidentiality',
    keywords: [
      /confidential/i,
      /trade\s+secrets/i,
      /perpetual/i,
      /non-disparagement/i,
      /portfolio|testimonial|public\s+mention/i,
      /automatic\s+penalty/i,
    ],
    detectRisk: (text, role) => {
      const perpetualPortfolioBan = /never\s+publish|never\s+list|portfolio.*ban|automatic\s+penalty/i.test(text);

      if (perpetualPortfolioBan) {
        return {
          risk: 'High',
          reason: 'Bans portfolio attribution permanently and threatens automatic penalties for mentioning you worked on the project.',
          riskFactors: ['Portfolio Blackout', 'Draconian Confidentiality Penalties'],
          suggestion: 'Carve out an exception to mention project experience and showcase anonymized or non-confidential screenshots.',
          saferAlternative: 'Contractor may list Company as a client and display non-sensitive project descriptions in Contractor’s portfolio, subject to Company’s prior written approval, not to be unreasonably withheld.',
        };
      }

      if (/perpetual/i.test(text)) {
        return {
          risk: 'Medium',
          reason: 'Confidentiality obligations are perpetual rather than limited to a standard 2–3 year duration.',
          riskFactors: ['Perpetual Confidentiality'],
          suggestion: 'Limit general commercial confidentiality to two (2) years following project completion, retaining trade secrets as the only perpetual item.',
          saferAlternative: 'Confidentiality obligations under this Agreement shall survive for a period of two (2) years following termination.',
        };
      }

      return {
        risk: 'Low',
        reason: 'Standard mutual non-disclosure and confidentiality obligations.',
        riskFactors: ['Standard Confidentiality'],
        suggestion: 'Protect confidential materials with customary care.',
        saferAlternative: '',
      };
    },
  },
];

/**
 * Execute deterministic risk analysis on segmented clauses
 */
export const runFallbackAnalysis = (clauses, userRole = 'freelancer') => {
  const analyzedClauses = [];
  const redFlagsSet = new Set();
  let highRiskCount = 0;
  let mediumRiskCount = 0;

  clauses.forEach((clause, index) => {
    let bestMatch = null;

    for (const rule of RISK_RULES) {
      const matchesKeyword = rule.keywords.some((regex) => regex.test(clause.text));
      if (matchesKeyword) {
        const assessment = rule.detectRisk(clause.text, userRole);
        if (!bestMatch || (assessment.risk === 'High' && bestMatch.risk !== 'High')) {
          bestMatch = {
            category: rule.category,
            ...assessment,
          };
        }
      }
    }

    if (!bestMatch) {
      bestMatch = {
        category: 'General Contractual Provisions',
        risk: 'Low',
        reason: 'This clause contains standard commercial terms or administrative definitions without obvious high-risk exposure.',
        riskFactors: ['Administrative Term'],
        suggestion: '',
        saferAlternative: '',
      };
    }

    if (bestMatch.risk === 'High') {
      highRiskCount++;
      if (bestMatch.riskFactors?.[0]) {
        redFlagsSet.add(`${bestMatch.category}: ${bestMatch.riskFactors[0]} detected — ${bestMatch.reason.split('.')[0]}.`);
      }
    } else if (bestMatch.risk === 'Medium') {
      mediumRiskCount++;
    }

    analyzedClauses.push({
      id: clause.id || `clause-${index + 1}`,
      text: clause.text,
      originalOrder: clause.originalOrder ?? index + 1,
      risk: bestMatch.risk,
      category: bestMatch.category,
      reason: bestMatch.reason,
      suggestion: bestMatch.suggestion || '',
      saferAlternative: bestMatch.saferAlternative || '',
      riskFactors: bestMatch.riskFactors || [],
      confidence: 0.92,
    });
  });

  // Calculate overall risk
  let overallRisk = 'Low';
  if (highRiskCount >= 1) {
    overallRisk = 'High';
  } else if (mediumRiskCount >= 1) {
    overallRisk = 'Medium';
  }

  // Executive summary
  const summary =
    overallRisk === 'High'
      ? `This agreement contains ${highRiskCount} critical high-risk clause(s) and ${mediumRiskCount} moderate risk item(s) that strongly favor the counterparty. Key concerns include aggressive liability terms, restrictive covenants, or unmetered IP/payment provisions. Negotiation is strongly recommended before signing.`
      : overallRisk === 'Medium'
      ? `This agreement is moderately balanced with ${mediumRiskCount} clause(s) requiring attention or clarification, notably regarding payment terms, notice periods, or scope definitions.`
      : `This agreement reflects relatively standard, customary terms with ${analyzedClauses.length} evaluated clauses and no major red flags identified.`;

  return {
    clauses: analyzedClauses,
    redFlags: Array.from(redFlagsSet),
    summary,
    overallRisk,
  };
};
