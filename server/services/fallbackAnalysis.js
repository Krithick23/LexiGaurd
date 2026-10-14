/**
 * LexiGuard Fallback Deterministic Contract Analysis Engine
 * Calibrated for:
 * 1. Freelancers (freelance services, SOWs, consulting agreements)
 * 2. Interns & Employees (internship agreements, offer letters, employment contracts, bonds)
 * 3. Small Business Owners (vendor/supplier agreements, customer contracts, commercial leases)
 * 4. Startup Founders (founder/shareholder agreements, term sheets, equity vesting)
 *
 * Implements full 3-stage pipeline deterministically:
 * Stage 1: Document classification & parties detection
 * Stage 2: Role-calibrated clause risk evaluation with impact & flags
 * Stage 3: Practical negotiation suggestions & safer alternative wording
 */

/**
 * Stage 1A: Deterministic Contract Classification
 */
export const classifyContractDeterministically = (rawText, userRole = 'freelancer') => {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return {
      documentType: 'General Contract / Unknown',
      parties: [],
      purpose: 'Unspecified agreement',
      confidence: 0.3,
      missingOrUnclearInfo: ['Empty or unreadable document'],
      classificationDetails: 'Document content is empty or unreadable.',
    };
  }

  const textSample = rawText.slice(0, 10000).toLowerCase();

  // Pattern detection
  const isInternship =
    /internship\s+agreement|internship\s+offer|intern\s+contract|stipend|intern\s+responsibilities|training\s+period.*intern/i.test(
      textSample
    );
  const isEmployment =
    !isInternship &&
    /employment\s+agreement|employment\s+contract|appointment\s+letter|offer\s+of\s+employment|annual\s+ctc|probation\s+period.*salary/i.test(
      textSample
    );
  const isNDA =
    /non-disclosure\s+agreement|\bnda\b|confidentiality\s+agreement|proprietary\s+information\s+and\s+inventions/i.test(
      textSample
    );
  const isFounder =
    /founder\s+agreement|founders'\s+agreement|shareholders?\s+agreement|co-founder|equity\s+vesting|investor\s+rights|term\s+sheet|liquidation\s+preference/i.test(
      textSample
    );
  const isVendorSMB =
    /vendor\s+agreement|supplier\s+agreement|purchase\s+order\s+agreement|commercial\s+lease|master\s+services\s+agreement.*supplier|sla\s+agreement/i.test(
      textSample
    );
  const isFreelance =
    /independent\s+contractor|freelance|consulting\s+agreement|statement\s+of\s+work|\bsow\b|contractor\s+agreement/i.test(
      textSample
    );

  let documentType = 'General Commercial Agreement';
  let confidence = 0.88;
  let purpose = 'Commercial agreement establishing legal terms between contracting parties.';

  if (isInternship) {
    documentType = 'Internship Agreement';
    purpose = 'Formalizes internship duration, stipend, learning deliverables, and workplace expectations.';
    confidence = 0.95;
  } else if (isEmployment) {
    documentType = 'Full-Time Employment Agreement';
    purpose = 'Defines employment role, compensation, probation conditions, and workplace restrictive covenants.';
    confidence = 0.95;
  } else if (isNDA) {
    documentType = 'Non-Disclosure Agreement (NDA)';
    purpose = 'Governs exchange and protection of proprietary confidential information.';
    confidence = 0.96;
  } else if (isFounder) {
    documentType = 'Founder / Shareholder Agreement';
    purpose = 'Regulates equity allocation, vesting schedules, decision-making control, and investor covenants.';
    confidence = 0.93;
  } else if (isVendorSMB) {
    documentType = 'Vendor & Supplier Agreement';
    purpose = 'Outlines supplier delivery milestones, commercial payment terms, and service commitments.';
    confidence = 0.91;
  } else if (isFreelance) {
    documentType = 'Freelance Service Agreement';
    purpose = 'Defines independent contractor services, milestone deliverables, and fee payment terms.';
    confidence = 0.94;
  } else {
    // Check if it's an ambiguous or short contract
    if (rawText.length < 500) {
      documentType = 'Informal Agreement / Note';
      confidence = 0.55;
    } else {
      documentType = 'Commercial Agreement (General)';
      confidence = 0.72;
    }
  }

  // Parties extraction
  const parties = [];
  const partyMatch = rawText.match(
    /(?:between|by\s+and\s+between)\s+([^\n,]+?)(?:,\s*and|\s+and)\s+([^\n,]+?)(?:\s*\(|\.|\n)/i
  );
  if (partyMatch && partyMatch[1] && partyMatch[2]) {
    parties.push(partyMatch[1].trim());
    parties.push(partyMatch[2].trim());
  } else {
    if (isInternship || isEmployment) {
      parties.push('Employer / Organization', 'Candidate / Employee');
    } else if (isFreelance) {
      parties.push('Client / Company', 'Independent Contractor');
    } else if (isVendorSMB) {
      parties.push('Customer / Buyer', 'Supplier / Vendor');
    } else if (isFounder) {
      parties.push('Founding Shareholders', 'Company Entity');
    } else {
      parties.push('Party of the First Part', 'Party of the Second Part');
    }
  }

  // Missing or unclear info check
  const missingOrUnclearInfo = [];
  if (!/(?:payment|salary|stipend|fee|compensation|inr|\$)/i.test(rawText)) {
    missingOrUnclearInfo.push('Payment or financial compensation terms are completely omitted.');
  }
  if (!/(?:terminat|notice\s+period|expiry)/i.test(rawText)) {
    missingOrUnclearInfo.push('Termination procedure and notice duration are not specified.');
  }
  if (!/(?:governing\s+law|jurisdiction|courts\s+of|arbitration)/i.test(rawText)) {
    missingOrUnclearInfo.push('Governing law and dispute resolution venue are absent.');
  }

  let classificationDetails = `Detected as a ${documentType} analyzed from the perspective of an authenticated ${userRole}.`;
  if (userRole === 'freelancer' && (isEmployment || isInternship)) {
    classificationDetails = `Notice: You are registered as a Freelancer, but this document appears to be an ${documentType}. It contains employment commitments rather than independent project terms.`;
  } else if ((userRole === 'intern' || userRole === 'employee') && isFreelance) {
    classificationDetails = `Notice: You are registered as an Intern, but this document is an Independent Contractor Agreement without intern or educational safeguards.`;
  }

  return {
    documentType,
    parties,
    purpose,
    confidence,
    missingOrUnclearInfo,
    classificationDetails,
  };
};

/**
 * Master Deterministic Risk Rules covering all 4 roles
 */
const ROLE_AWARE_RULES = [
  // 1. NON-COMPETE & POST-TERMINATION RESTRAINTS
  {
    category: 'Non-Compete & Restrictive Covenants',
    keywords: [
      /non-compete/i,
      /not\s+(?:directly\s+or\s+indirectly\s+)?(?:engage|consult|work|compete)/i,
      /restraint\s+of\s+trade/i,
      /post-termination\s+restriction/i,
      /(?:12|24|36)\s+months.*(?:compete|restrict)/i,
      /(?:exclusive\s+(?:services|engagement|employment|contractor)|exclusivity\s+obligation|work\s+exclusively)/i,
    ],
    evaluate: (text, role, docType) => {
      const isPostTermination = /(?:after|following|upon)\s+(?:termination|expiry)/i.test(text) ||
        /(?:12|24|36)\s+months/i.test(text);

      if (role === 'employee' || role === 'intern') {
        const isIntern = docType.includes('Intern') || role === 'intern';
        if (isIntern) {
          return {
            title: 'Intern Post-Exit Non-Compete Trap',
            risk: 'Critical',
            riskScore: 92,
            reason:
              'Imposes a post-internship non-compete restriction on a student/intern. Under Section 27 of the Indian Contract Act, 1872, all post-employment non-compete agreements are void as restraint of trade.',
            whyItMatters:
              'As an intern, you are entering the workforce to build your career. A non-compete can unlawfully block you from taking full-time jobs at other companies in your field.',
            impact: {
              financial: 'Restricts future employment opportunities and earning potential.',
              legal: 'Statutorily void under Section 27 ICA, but counterparty may use legal threats.',
              operational: 'Forces you to decline job offers from peer organizations.',
            },
            suggestedAction: 'Delete the post-internship non-compete clause entirely.',
            flags: { isMissing: false, isAmbiguous: false, isUnusual: true, isOneSided: true },
            suggestion:
              'Propose deleting the post-internship non-compete in its entirety, replacing it with a simple confidentiality undertaking.',
            saferAlternative:
              'Intern agrees to maintain strict confidentiality of Company proprietary data. No post-internship employment restrictions shall apply.',
            priority: 'Critical',
            recommendLegalReview: false,
          };
        }

        return {
          title: 'Post-Employment Non-Compete Covenant',
          risk: 'High',
          riskScore: 82,
          reason:
            'Contains a post-employment non-compete clause. Under Section 27 of the Indian Contract Act, 1872, covenants restricting an employee from working after leaving employment are void and unenforceable in India.',
          whyItMatters:
            'While legally unenforceable, employers often use these clauses in offer letters to threaten or delay departing staff.',
          impact: {
            financial: 'Risk of counterparty intimidation when switching jobs.',
            legal: 'Unenforceable under Indian law, but creates needless friction upon resignation.',
            operational: 'May complicate joining peer companies in the same vertical.',
          },
          suggestedAction:
            'Propose striking the post-employment non-compete, retaining only a reasonable non-solicitation of active clients and employees.',
          saferAlternative:
            'Employee agrees not to solicit active employees or clients of Company for a period of six (6) months following departure. Employee retains full freedom to accept employment with any other employer.',
          priority: 'High',
          recommendLegalReview: false,
        };
      }

      if (role === 'freelancer') {
        return {
          title: 'Post-Contract Restraint of Trade',
          risk: 'Critical',
          riskScore: 95,
          reason:
            'Prohibits contractor from working with other clients or industry competitors after contract termination. Violates Section 27 of the Indian Contract Act, 1872.',
          whyItMatters:
            'Freelancers rely on industry specialization and multiple client relationships. Barring you from taking other projects can destroy your freelance practice.',
          impact: {
            financial: 'Blocks core client acquisition and severely harms your livelihood.',
            legal: 'Void under Indian law, but clients weaponize them in dispute correspondence.',
            operational: 'Inability to service other clients in your primary technical stack.',
          },
          suggestedAction:
            'Strike the post-termination non-compete entirely and limit exclusivity strictly to the specific active statement of work.',
          saferAlternative:
            'Contractor agrees not to provide direct consulting services to named direct competitors of Company on the specific project scope during the active Statement of Work.',
          priority: 'Critical',
          recommendLegalReview: false,
        };
      }

      if (role === 'small_business') {
        return {
          title: 'Overbroad Commercial Exclusivity',
          risk: 'High',
          riskScore: 78,
          reason:
            'Restricts your business from servicing competing enterprises or marketing similar products in the wider sector.',
          whyItMatters:
            'A small business cannot survive by closing itself off to an entire vertical for a single client.',
          impact: {
            financial: 'Restricts market share and prevents closing new enterprise customer accounts.',
            legal: 'May constitute restraint of trade depending on duration and territory.',
            operational: 'Prevents scaling similar SaaS or agency offerings to the market.',
          },
          suggestedAction:
            'Limit exclusivity to named direct competitors during the active contract term only.',
          saferAlternative:
            'Vendor agrees not to provide identical bespoke deliverables to direct competitors named in Exhibit A during the active term of this Agreement.',
          priority: 'High',
          recommendLegalReview: false,
        };
      }

      if (role === 'founder') {
        return {
          title: 'Founder Restrictive Covenants',
          risk: 'High',
          riskScore: 80,
          reason:
            'Imposes stringent non-compete and non-solicitation restrictions on founders that may survive departure.',
          whyItMatters:
            'Founders must ensure restrictions are balanced and tied strictly to holding equity, not extended indefinitely if pushed out.',
          impact: {
            financial: 'Inability to launch new ventures in related domains upon exit.',
            legal: 'Subject to enforceability scrutiny under shareholder agreements.',
            operational: 'Limits future venture building.',
          },
          suggestedAction:
            'Ensure non-compete applies only while holding substantial equity (>5%) and for at most 12 months following a fair buyout.',
          saferAlternative:
            'Founder agrees not to establish a directly competing business for twelve (12) months following termination of engagement, provided Founder receives fair market compensation for vested shares.',
          priority: 'High',
          recommendLegalReview: true,
        };
      }

      return {
        title: 'Restrictive Covenants',
        risk: 'High',
        riskScore: 75,
        reason: 'Restricts post-contract commercial activities.',
        whyItMatters: 'Limits business freedom.',
        impact: { financial: 'Restricted market', legal: 'Section 27 scrutiny', operational: 'Limited scope' },
        suggestedAction: 'Clarify boundaries of restrictive covenants.',
        saferAlternative: '',
        priority: 'High',
        recommendLegalReview: false,
      };
    },
  },

  // 2. PAYMENT TERMS, DELAYS, AND WITHHOLDINGS
  {
    category: 'Payment Terms',
    keywords: [
      /payment\s+terms/i,
      /invoic/i,
      /withhold|forfeit|deduct/i,
      /subjective\s+satisfaction|sole\s+discretion/i,
      /60\s+days|90\s+days|120\s+days/i,
      /stipend|salary/i,
      /disburs/i,
    ],
    evaluate: (text, role, docType) => {
      const isDelayed = /60\s+days|90\s+days|120\s+days/i.test(text);
      const isArbitrary = /withhold|forfeit|sole\s+discretion|subjective/i.test(text);

      if (role === 'employee' || role === 'intern') {
        const isIntern = docType.includes('Intern') || role === 'intern';
        if (isIntern && (/unpaid/i.test(text) || /no\s+stipend/i.test(text))) {
          return {
            title: 'Unpaid Internship / Zero Compensation',
            risk: 'High',
            riskScore: 78,
            reason:
              'Specifies zero stipend or unpaid work despite substantial operational deliverables.',
            whyItMatters:
              'Interns providing measurable commercial labor should receive a fair monthly stipend.',
            impact: {
              financial: 'Zero compensation for full-time or part-time work.',
              legal: 'Risk of unpaid labor exploitation.',
              operational: 'Financial burden of self-funding travel and work expenses.',
            },
            suggestedAction: 'Request a monthly fixed stipend to cover living and transit expenses.',
            saferAlternative:
              'Company shall pay Intern a monthly stipend of [INR Amount] payable on the 1st of each calendar month.',
            priority: 'High',
            recommendLegalReview: false,
          };
        }

        if (isArbitrary || /deduct/i.test(text)) {
          return {
            title: 'Discretionary Salary Deductions / Withholding',
            risk: 'High',
            riskScore: 82,
            reason:
              'Allows employer to withhold or deduct salary based on unilateral or subjective criteria.',
            whyItMatters:
              'Under the Payment of Wages Act, 1936, employers cannot make unauthorized arbitrary deductions from earned employee wages.',
            impact: {
              financial: 'Unexpected loss of earned monthly income.',
              legal: 'Potential violation of statutory wage protection laws.',
              operational: 'Disputes over monthly paycheck calculations.',
            },
            suggestedAction:
              'Remove discretionary withholding language; specify that deductions apply strictly to statutory taxes or mutual written agreement.',
            saferAlternative:
              'Salary shall be disbursed in full on or before the 1st of each month. Deductions shall be made strictly in accordance with applicable tax and statutory laws.',
            priority: 'High',
            recommendLegalReview: false,
          };
        }

        return {
          title: 'Standard Compensation Schedule',
          risk: 'Low',
          riskScore: 20,
          reason: 'Outlines standard periodic salary or stipend disbursement timelines.',
          whyItMatters: 'Ensures predictable compensation schedule.',
          impact: { financial: 'Predictable earnings', legal: 'Compliant', operational: 'Standard' },
          suggestedAction: 'Verify bank account and tax withholding details in writing.',
          flags: { isMissing: false, isAmbiguous: false, isUnusual: false, isOneSided: false },
          suggestion: 'Ensure direct bank transfer is designated as the primary payment method.',
          saferAlternative: '',
          priority: 'Low',
          recommendLegalReview: false,
        };
      }

      if (role === 'freelancer') {
        if (isDelayed || isArbitrary) {
          return {
            title: 'Predatory Payment Window & Unilateral Withholding',
            risk: 'Critical',
            riskScore: 90,
            reason:
              'Imposes severe payment delays (60–90+ days) or gives the client subjective authority to withhold, discount, or forfeit freelance fees.',
            whyItMatters:
              'Subjective withholding leaves freelancers unpaid after deliverables are already shipped.',
            impact: {
              financial: 'Severe cash flow starvation and risk of unrecoverable bad debt.',
              legal: 'Gives client an open-ended defense to refuse payment without formal breach.',
              operational: 'Forces you to work on credit for months.',
            },
            suggestedAction:
              'Insist on Net-15 or Net-30 payment terms with milestone sign-offs deemed accepted if not disputed within 7 days.',
            saferAlternative:
              'Client shall review deliverables within seven (7) business days. Payment shall be made within fifteen (15) days of undisputed invoice submission. Undisputed balances past 30 days shall accrue 1.5% monthly interest.',
            priority: 'Critical',
            recommendLegalReview: false,
          };
        }

        return {
          title: 'Freelance Invoicing & Disbursement',
          risk: 'Medium',
          riskScore: 50,
          reason:
            'Payment terms require clear invoice submission protocols and milestone acceptance timelines.',
          whyItMatters: 'Clear payment schedules avoid billing disputes.',
          impact: {
            financial: 'Cash flow timing dependent on prompt client approvals.',
            legal: 'Standard contractual debt obligations.',
            operational: 'Regular invoicing required.',
          },
          suggestedAction: 'Confirm Net-15 or Net-30 payment schedule.',
          saferAlternative:
            'Invoices are payable within twenty (20) calendar days of electronic submission.',
          priority: 'Medium',
          recommendLegalReview: false,
        };
      }

      if (role === 'small_business') {
        if (isDelayed || isArbitrary) {
          return {
            title: 'Asymmetric Payment Terms & Client Audit Clawback',
            risk: 'High',
            riskScore: 84,
            reason:
              'Enterprise client imposes Net-90/120 payment terms with unilateral clawback rights.',
            whyItMatters:
              'Small business vendors fund payroll and supplier costs upfront; excessive payment cycles risk business solvency.',
            impact: {
              financial: 'Working capital strain and potential bank overdraft costs.',
              legal: 'One-sided audit deduction rights.',
              operational: 'Vendor is forced to finance enterprise procurement.',
            },
            suggestedAction:
              'Propose Net-30 payment terms and require an upfront deposit (25–50%) for milestone work.',
            saferAlternative:
              'Payment terms are Net-30 days from invoice date. Client shall pay an advance deposit of 30% prior to commencement of work.',
            priority: 'High',
            recommendLegalReview: false,
          };
        }
      }

      if (role === 'founder') {
        return {
          title: 'Capital Distribution & Dividend Terms',
          risk: 'Medium',
          riskScore: 45,
          reason: 'Payment and distribution provisions affect cash retention and runway.',
          whyItMatters: 'Ensures capital is prioritized for company operations before distributions.',
          impact: { financial: 'Cash preservation', legal: 'Board governed', operational: 'Standard' },
          suggestedAction: 'Ensure all dividends require board approval.',
          saferAlternative: '',
          priority: 'Medium',
          recommendLegalReview: false,
        };
      }

      return {
        title: 'Commercial Payment Terms',
        risk: 'Low',
        riskScore: 20,
        reason: 'Payment and disbursement provisions appear customary with defined timelines.',
        whyItMatters: 'Ensures structured financial obligations.',
        impact: { financial: 'Standard payment schedule', legal: 'Clear terms', operational: 'Predictable' },
        suggestedAction: 'Verify invoice processing details.',
        saferAlternative: '',
        priority: 'Low',
        recommendLegalReview: false,
      };
    },
  },

  // 3. INTELLECTUAL PROPERTY & INVENTIONS ASSIGNMENT
  {
    category: 'Intellectual Property',
    keywords: [
      /intellectual\s+property/i,
      /assign(?:s|ment)?\s+(?:all\s+)?(?:right|title|interest)/i,
      /moral\s+rights/i,
      /work\s+made\s+for\s+hire/i,
      /pre-existing/i,
      /inventions/i,
      /background\s+ip/i,
      /portfolio/i,
    ],
    evaluate: (text, role, docType) => {
      const capturesPriorWork = /pre-existing|background\s+ip|side\s+project|prior\s+open[- ]source/i.test(text);
      const beforePayment = /prior\s+to\s+payment|immediately\s+upon\s+creation|irrespective\s+of.*payment/i.test(text);
      const moralRightsWaiver = /moral\s+rights|waives?\s+all\s+attribution/i.test(text);

      if (role === 'employee' || role === 'intern') {
        const isIntern = docType.includes('Intern') || role === 'intern';
        const capturesOffHours = /whether\s+or\s+not\s+during\s+work\s+hours|personal\s+equipment|any\s+invention/i.test(text);

        if (capturesOffHours) {
          return {
            title: 'Blanket Off-Hours IP & Invention Grab',
            risk: 'High',
            riskScore: 85,
            reason:
              'Requires employee to assign all inventions and software code created outside work hours, on personal computers, unrelated to company duties.',
            whyItMatters:
              'An employer should only own IP created within your assigned scope of work during employment hours.',
            impact: {
              financial: 'Loss of rights to personal side hustles, mobile apps, or open-source software.',
              legal: 'Overbroad assignment claiming rights without company consideration.',
              operational: 'Inability to build personal technical projects.',
            },
            suggestedAction:
              'Carve out an explicit exception for inventions created on personal time without company resources or trade secrets.',
            saferAlternative:
              'Company shall own IP created solely within Employee’s direct scope of employment duties using Company resources. Employee retains sole ownership of inventions created on personal time without using Company confidential data.',
            priority: 'High',
            recommendLegalReview: false,
          };
        }

        if (isIntern) {
          return {
            title: 'Intern Project IP Assignment & Academic Credit',
            risk: 'Medium',
            riskScore: 50,
            reason:
              'Assigns all project IP to company without explicit permission for academic submission or portfolio credit.',
            whyItMatters:
              'Interns often need to submit project reports to their university or showcase non-sensitive code.',
            impact: {
              financial: 'Standard for employer-funded work.',
              legal: 'Complete assignment to company.',
              operational: 'Risk of university report rejection without written clearance.',
            },
            suggestedAction:
              'Request written permission to use anonymized project descriptions in academic submissions.',
            saferAlternative:
              'Company owns project deliverables. Intern may submit an anonymized summary of the project to their educational institution for academic evaluation.',
            priority: 'Medium',
            recommendLegalReview: false,
          };
        }

        return {
          title: 'Employment Intellectual Property Assignment',
          risk: 'Low',
          riskScore: 25,
          reason:
            'Customary assignment of inventions conceived within the course of employment under Section 17(c) of the Indian Copyright Act, 1957.',
          whyItMatters:
            'Under Section 17 of the Copyright Act, an employer is the first owner of works created during employment, but personal projects created outside work hours must remain protected.',
          impact: {
            financial: 'Standard employment baseline.',
            legal: 'Section 17 statutory framework.',
            operational: 'Work-related IP belongs to employer.',
          },
          suggestedAction: 'Ensure assignments are limited to work duties performed during employment hours.',
          saferAlternative:
            'Employee assigns all works and code created in the direct performance of assigned employment duties during working hours.',
          priority: 'Low',
          recommendLegalReview: false,
        };
      }

      if (role === 'freelancer') {
        if (capturesPriorWork || beforePayment) {
          return {
            title: 'Pre-Payment IP Transfer & Background Tool Grab',
            risk: 'Critical',
            riskScore: 92,
            reason:
              'Transfers IP ownership to client before full payment is cleared, and claims contractor pre-existing code, tools, or open-source frameworks.',
            whyItMatters:
              'IP ownership is your single strongest leverage to ensure payment. Surrendering IP before payment leaves you powerless if the client defaults.',
            impact: {
              financial: 'Client owns your work with zero payment obligation.',
              legal: 'Loss of title to your reusable developer libraries and utilities.',
              operational: 'Breaches third-party open source licenses if you assign code you do not own.',
            },
            suggestedAction:
              'Insist that IP ownership transfers strictly upon receipt of full and final invoice payment.',
            saferAlternative:
              'Upon receipt of full and final payment for the applicable deliverables, Contractor transfers to Client all right and title in custom deliverables created solely for Client. Contractor retains full ownership of pre-existing tools and background libraries.',
            priority: 'Critical',
            recommendLegalReview: false,
          };
        }

        if (moralRightsWaiver) {
          return {
            title: 'Total Portfolio Blackout & Moral Rights Waiver',
            risk: 'Medium',
            riskScore: 55,
            reason:
              'Waives all attribution rights under Indian Copyright Act, 1957 and forbids listing the engagement in your portfolio.',
            whyItMatters:
              'Freelancers win future contracts by showing completed case studies.',
            impact: {
              financial: 'Slows client pipeline by preventing social proof.',
              legal: 'Waives statutory attribution rights.',
              operational: 'Cannot display non-confidential project highlights.',
            },
            suggestedAction:
              'Carve out non-confidential portfolio display rights.',
            saferAlternative:
              'Contractor may display non-sensitive, public screenshots and descriptions of the completed work in Contractor’s professional portfolio.',
            priority: 'Medium',
            recommendLegalReview: false,
          };
        }

        return {
          title: 'Freelance Deliverables IP Assignment',
          risk: 'Medium',
          riskScore: 50,
          reason:
            'Assigns deliverables to client. Freelancers should ensure assignment occurs upon full payment and that pre-existing background tools are excluded.',
          whyItMatters:
            'Freelance contracts must protect background code and ensure transfer occurs only upon receiving agreed compensation.',
          impact: {
            financial: 'Deliverable rights transferred.',
            legal: 'Work for hire principles.',
            operational: 'Maintain background tools.',
          },
          suggestedAction: 'Ensure IP transfer is contingent upon full invoice payment.',
          saferAlternative:
            'All rights to custom deliverables transfer to Client upon full and final payment of all undisputed invoices.',
          priority: 'Medium',
          recommendLegalReview: false,
        };
      }

      if (role === 'small_business') {
        return {
          title: 'Proprietary Background Technology & Brand IP',
          risk: 'High',
          riskScore: 78,
          reason:
            'Ambiguously drafted IP clause may transfer vendor pre-existing software platform or proprietary algorithms to client.',
          whyItMatters:
            'Small businesses must preserve ownership of their core intellectual property and grant customers only a license to use.',
          impact: {
            financial: 'Risk of losing enterprise asset value and IP ownership.',
            legal: 'May cloud investor and trademark diligence.',
            operational: 'Cannot reuse underlying software architecture for other clients.',
          },
          suggestedAction:
            'Clarify that vendor retains all underlying software and platform IP, granting client a non-exclusive license.',
          saferAlternative:
            'Vendor retains all ownership of its pre-existing software, platforms, and methodologies. Client receives a non-exclusive license to use the deliverables for internal business operations.',
          priority: 'High',
          recommendLegalReview: false,
        };
      }

      if (role === 'founder') {
        return {
          title: 'Company IP Assignment & Technology Vesting',
          risk: 'High',
          riskScore: 84,
          reason:
            'IP clause must irrevocably vest all pre-incorporation and future product IP in the corporate entity, not individual founders.',
          whyItMatters:
            'If a founder leaves while personally holding patent or code ownership, the startup becomes uninvestable.',
          impact: {
            financial: 'Direct risk to venture funding rounds and institutional valuations.',
            legal: 'Clean chain of title required for Delaware/Indian entity diligence.',
            operational: 'Company must own all proprietary technology.',
          },
          suggestedAction:
            'Execute a comprehensive IP assignment deed transferring all founder inventions to the startup entity.',
          saferAlternative:
            'All founders irrevocably assign to the Company all right, title, and interest in and to all technology, code, and inventions conceived in connection with the Company.',
          priority: 'High',
          recommendLegalReview: true,
        };
      }

      return {
        title: 'Intellectual Property Ownership',
        risk: 'Low',
        riskScore: 25,
        reason: 'Defines intellectual property allocation between parties.',
        whyItMatters: 'Governs ownership and licensing of created assets.',
        impact: { financial: 'Asset rights', legal: 'Ownership baseline', operational: 'Standard' },
        suggestedAction: 'Verify IP allocation matches commercial agreement.',
        saferAlternative: '',
        priority: 'Low',
        recommendLegalReview: false,
      };
    },
  },

  // 4. TERMINATION, NOTICE PERIODS & BONDS
  {
    category: 'Termination & Penalties',
    keywords: [
      /terminat/i,
      /with\s+or\s+without\s+cause/i,
      /liquidated\s+damages/i,
      /penalty|penalties/i,
      /notice\s+period/i,
      /training\s+bond|service\s+bond/i,
      /clawback/i,
    ],
    evaluate: (text, role, docType) => {
      const isBond = /training\s+bond|service\s+bond|bond\s+amount|pay\s+(?:inr|\$)\s*[0-9,]+.*leaving/i.test(text);
      const isAsymmetric = /company\s+may\s+terminate.*immediately.*(?:contractor|employee)\s+may\s+terminate.*(?:60|90)\s+days/is.test(text);
      const is90DayNotice = /90\s+days?\s+notice|3\s+months?\s+notice/i.test(text);

      if (role === 'employee' || role === 'intern') {
        const isIntern = docType.includes('Intern') || role === 'intern';

        if (isBond) {
          return {
            title: 'Employment / Training Bond Penalty Trap',
            risk: 'Critical',
            riskScore: 95,
            reason:
              'Imposes a mandatory bond repayment penalty or liquidated damages fee if the worker departs before a stipulated period.',
            whyItMatters:
              'Under Section 74 of the Indian Contract Act, 1872, liquidated damages clauses that act as in terrorem penalties are legally unenforceable. An employer can only recover actual, proven training expenses, yet predatory employers use bonds to trap workers.',
            impact: {
              financial: 'Threat of heavy financial extortion upon wanting to resign.',
              legal: 'Largely unenforceable as penalty in Indian courts, but causes severe harassment.',
              operational: 'Traps the worker in a hostile work environment.',
            },
            suggestedAction:
              'Refuse the bond outright or cap liability strictly to verifiable third-party certification invoices with pro-rata monthly amortization.',
            saferAlternative:
              'Either party may terminate employment with standard thirty (30) days notice. No bond penalties or exit fees shall apply.',
            priority: 'Critical',
            recommendLegalReview: true,
          };
        }

        if (isIntern && /withhold.*certificate|forfeit.*stipend/i.test(text)) {
          return {
            title: 'Intern Certificate Withholding Threat',
            risk: 'High',
            riskScore: 88,
            reason:
              'Threatens to withhold internship completion certificates or forfeit all accumulated stipends upon early departure.',
            whyItMatters:
              'Interns must receive truthful verification of months actually served.',
            impact: {
              financial: 'Forfeiture of earned compensation.',
              legal: 'Unfair trade practice and extortionate condition.',
              operational: 'Inability to verify completed internship with college.',
            },
            suggestedAction:
              'Confirm that completion certificates will be issued pro-rata for all days served.',
            saferAlternative:
              'Company shall provide Intern with a formal experience and completion letter verifying the exact dates of service completed.',
            priority: 'High',
            recommendLegalReview: false,
          };
        }

        if (is90DayNotice) {
          return {
            title: 'Excessive 90-Day Notice Period Lock-In',
            risk: 'High',
            riskScore: 78,
            reason:
              'Imposes an onerous 90-day (3-month) notice period with no buyout option.',
            whyItMatters:
              'Most new employers in India refuse to wait 90 days, severely handicapping your ability to secure better job offers.',
            impact: {
              financial: 'Potential loss of lucrative outside job offers.',
              legal: 'Binds employee to protracted exit process.',
              operational: 'Extended transition delays.',
            },
            suggestedAction:
              'Negotiate a 30-day notice period or a mutual notice buyout clause.',
            saferAlternative:
              'Either party may terminate employment upon thirty (30) days prior written notice, or payment of salary in lieu thereof.',
            priority: 'High',
            recommendLegalReview: false,
          };
        }
      }

      if (role === 'freelancer') {
        if (isAsymmetric || /liquidated\s+damages/i.test(text)) {
          return {
            title: 'Asymmetric Termination & Liquidated Damages Penalty',
            risk: 'High',
            riskScore: 86,
            reason:
              'Client reserves the right to terminate instantly with zero notice, while contractor must give extended notice or pay damages.',
            whyItMatters:
              'Freelancers must receive mutual termination rights and payment for all work-in-progress.',
            impact: {
              financial: 'Uncompensated hours if client terminates mid-sprint.',
              legal: 'One-sided contractual breach vulnerability.',
              operational: 'Instant loss of billable hours with no transition buffer.',
            },
            suggestedAction:
              'Require mutual 14–30 days written notice with guaranteed compensation for all work completed up to termination.',
            saferAlternative:
              'Either party may terminate this Agreement without cause upon fourteen (14) days prior written notice. Client shall pay for all work completed up to the effective termination date.',
            priority: 'High',
            recommendLegalReview: false,
          };
        }
      }

      if (role === 'small_business') {
        return {
          title: 'Commercial Termination for Convenience & Exit Fees',
          risk: 'Medium',
          riskScore: 60,
          reason:
            'Client can terminate contract for convenience without reimbursing unamortized setup costs.',
          whyItMatters:
            'Vendors must recover initial infrastructure and onboarding investments upon early termination.',
          impact: {
            financial: 'Unrecovered upfront capital expenditures.',
            legal: 'Asymmetric termination rights.',
            operational: 'Premature pipeline disruption.',
          },
          suggestedAction:
            'Include an early termination fee covering unamortized deployment costs if client terminates for convenience.',
          saferAlternative:
            'If Client terminates for convenience prior to term completion, Client shall reimburse Vendor for reasonable non-cancellable deployment costs incurred.',
          priority: 'Medium',
          recommendLegalReview: false,
        };
      }

      if (role === 'founder') {
        return {
          title: 'Founder Departure & Good/Bad Leaver Buyback',
          risk: 'Critical',
          riskScore: 90,
          reason:
            'Dictates equity buyback terms upon founder departure. If voluntary resignation is defined as a "Bad Leaver", founder forfeits earned vested equity at nominal par value (INR 1).',
          whyItMatters:
            'Founders must ensure voluntary resignation after 2-3 years is treated as a Good Leaver retaining vested shares or sold at Fair Market Value.',
          impact: {
            financial: 'Complete loss of millions in startup equity value.',
            legal: 'Punitive forfeiture clause.',
            operational: 'Hostile co-founder exit dynamics.',
          },
          suggestedAction:
            'Narrow Bad Leaver strictly to criminal fraud, gross misconduct, or material uncured breach; vested equity must be repurchased at Fair Market Value.',
          saferAlternative:
            'A Good Leaver shall retain all vested shares. If the Company exercises a repurchase option on vested shares, repurchase shall be executed at Fair Market Value determined by an independent valuer.',
          priority: 'Critical',
          recommendLegalReview: true,
        };
      }

      return {
        title: 'Termination & Expiry Terms',
        risk: 'Low',
        riskScore: 25,
        reason: 'Standard mutual termination or contract expiry notice terms.',
        whyItMatters: 'Ensures structured exit procedure.',
        impact: { financial: 'Predictable exit', legal: 'Mutual', operational: 'Standard' },
        suggestedAction: 'Confirm required written notice duration.',
        saferAlternative: '',
        priority: 'Low',
        recommendLegalReview: false,
      };
    },
  },

  // 5. INDEMNITY, LIABILITY & CAPS
  {
    category: 'Indemnity & Liability',
    keywords: [
      /indemnif/i,
      /hold\s+harmless/i,
      /unlimited\s+liability|uncapped/i,
      /consequential\s+damages/i,
      /maximum\s+liability/i,
      /gross\s+negligence/i,
    ],
    evaluate: (text, role, docType) => {
      const isUnlimited = /unlimited|uncapped|regardless\s+of\s+cause/i.test(text);
      const isLopsidedCap = /client.*liability.*(?:inr\s*1,?000|\$100|nominal)/i.test(text) ||
        (/contractor.*indemnif/i.test(text) && !/company.*indemnif/i.test(text));

      if (role === 'freelancer' || role === 'small_business') {
        if (isUnlimited || isLopsidedCap) {
          return {
            title: 'Uncapped Personal Liability & One-Sided Indemnity',
            risk: 'Critical',
            riskScore: 94,
            reason:
              'Imposes unlimited, uncapped indemnification on you for any third-party claims, while capping client liability to zero or nominal fees.',
            whyItMatters:
              'A single third-party legal claim could lead to personal bankruptcy. Individual contractors and small agencies cannot insure uncapped enterprise exposure.',
            impact: {
              financial: 'Potential bankruptcy from third-party lawsuits.',
              legal: 'Catastrophic indemnity exposure.',
              operational: 'Inability to obtain commercial errors & omissions insurance.',
            },
            suggestedAction:
              'Cap aggregate liability for both parties strictly to total fees paid under the contract in the preceding 6–12 months, and exclude indirect/consequential damages.',
            saferAlternative:
              'Except for gross negligence or willful misconduct, each party’s total aggregate liability arising under this Agreement shall be limited to the total fees paid by Client to Contractor in the preceding six (6) months. Neither party shall be liable for indirect, special, or consequential damages.',
            priority: 'Critical',
            recommendLegalReview: true,
          };
        }

        return {
          title: 'Mutual Limitation of Liability',
          risk: 'Low',
          riskScore: 25,
          reason: 'Liability terms appear mutually capped with standard carve-outs.',
          whyItMatters: 'Protects commercial downside.',
          impact: { financial: 'Capped exposure', legal: 'Mutual', operational: 'Standard' },
          suggestedAction: 'Verify that the liability cap covers both parties equally.',
          saferAlternative: '',
          priority: 'Low',
          recommendLegalReview: false,
        };
      }

      if (role === 'founder') {
        return {
          title: 'Founder Personal Indemnification Exposure',
          risk: 'High',
          riskScore: 82,
          reason:
            'Requires individual founders to personally indemnify investors or commercial clients without limiting liability to corporate assets.',
          whyItMatters:
            'The entire purpose of incorporation is limited liability. Personal indemnities pierce the corporate veil.',
          impact: {
            financial: 'Personal savings and assets exposed to commercial lawsuits.',
            legal: 'Loss of corporate limited liability protection.',
            operational: 'Severe personal financial distress.',
          },
          suggestedAction:
            'Ensure indemnities are solely corporate obligations of the startup company, not personal liabilities of the individual founders.',
          saferAlternative:
            'Indemnification obligations under this Agreement shall be borne solely by the Company as a corporate entity. No individual founder, officer, or director shall have personal liability.',
          priority: 'High',
          recommendLegalReview: true,
        };
      }

      return {
        title: 'Standard Indemnity Provisions',
        risk: 'Low',
        riskScore: 25,
        reason: 'Standard mutual indemnification clause.',
        whyItMatters: 'Customary terms.',
        impact: { financial: 'Standard', legal: 'Balanced', operational: 'Standard' },
        suggestedAction: 'Confirm terms are mutual.',
        saferAlternative: '',
        priority: 'Low',
        recommendLegalReview: false,
      };
    },
  },

  // 6. GOVERNING LAW & DISPUTE JURISDICTION
  {
    category: 'Dispute Resolution',
    keywords: [
      /governing\s+law/i,
      /jurisdiction/i,
      /courts?\s+of/i,
      /delaware|california|new\s+york|england|london|singapore/i,
      /arbitration/i,
    ],
    evaluate: (text, role, docType) => {
      const isForeign = /delaware|california|new\s+york|england|london/i.test(text);

      if (isForeign && (role === 'freelancer' || role === 'employee')) {
        return {
          title: 'Foreign Jurisdiction & Governing Law Trap',
          risk: 'High',
          riskScore: 86,
          reason:
            'Designates foreign courts (e.g. Delaware, US or London, UK) for resolving disputes.',
          whyItMatters:
            'If an overseas client refuses to pay an Indian freelancer INR 1,00,000, hiring US attorneys costs thousands of dollars, making legal recovery impossible.',
          impact: {
            financial: 'Prohibitive legal expenses to enforce unpaid claims.',
            legal: 'Indian statutory labor/contract protections compromised.',
            operational: 'Client can breach with practical impunity.',
          },
          suggestedAction:
            'Negotiate governing law and jurisdiction to India, or propose mutual virtual arbitration under SIAC / Indian Arbitration Act.',
          saferAlternative:
            'This Agreement shall be governed by the laws of India. Any dispute shall be resolved through virtual arbitration under the Arbitration and Conciliation Act, 1996, seated in India.',
          priority: 'High',
          recommendLegalReview: false,
        };
      }

      return {
        title: 'Domestic Jurisdiction & Dispute Resolution',
        risk: 'Low',
        riskScore: 20,
        reason: 'Governing law is standard domestic law or mutual arbitration.',
        whyItMatters: 'Accessible dispute venue.',
        impact: { financial: 'Low cost', legal: 'Enforceable', operational: 'Local' },
        suggestedAction: 'Ensure arbitration venue is convenient.',
        saferAlternative: '',
        priority: 'Low',
        recommendLegalReview: false,
      };
    },
  },

  // 7. SCOPE OF WORK & UNILATERAL REVISIONS
  {
    category: 'Scope of Work',
    keywords: [
      /scope\s+of\s+(?:work|services)/i,
      /deliverables/i,
      /unilateral|at\s+any\s+time/i,
      /alter|modify|expand/i,
      /without.*compensation/i,
      /acceptance\s+criteria/i,
      /revision/i,
    ],
    evaluate: (text, role, docType) => {
      if (/alter|modify|expand/i.test(text) && /without.*(?:compensation|adjustment)/i.test(text)) {
        return {
          title: 'Uncompensated Scope Creep & Unilateral Changes',
          risk: 'Critical',
          riskScore: 88,
          reason:
            'Allows client to unilaterally alter or expand deliverables without paying additional compensation or extending deadlines.',
          whyItMatters:
            'Uncontrolled scope creep is the #1 killer of freelance and agency margins.',
          impact: {
            financial: 'Unpaid extra working hours and destroyed profit margins.',
            legal: 'Client can declare breach if you refuse unpaid extra work.',
            operational: 'Project schedule bloat and missed milestones.',
          },
          suggestedAction:
            'Require all modifications to be executed via a written Change Order signed by both parties with additional billing.',
          saferAlternative:
            'Any changes to project scope, deliverables, or timelines must be mutually agreed in writing via a formal Change Order specifying applicable additional fees.',
          priority: 'Critical',
          recommendLegalReview: false,
        };
      }

      return {
        title: 'Project Scope & Deliverable Milestones',
        risk: 'Low',
        riskScore: 25,
        reason: 'Outlines project responsibilities and deliverable expectations.',
        whyItMatters: 'Sets clear working baseline.',
        impact: { financial: 'Defines deliverables', legal: 'Baseline', operational: 'Standard' },
        suggestedAction: 'Ensure detailed specifications are attached in the SOW.',
        saferAlternative: '',
        priority: 'Low',
        recommendLegalReview: false,
      };
    },
  },
];

/**
 * Stage 2 & 3: Master Deterministic Fallback Analysis
 */
export const runFallbackAnalysis = (clauses, userRole = 'freelancer', contractClassification = {}) => {
  const docType = contractClassification.documentType || 'Agreement';
  const analyzedClauses = [];
  const redFlagsSet = new Set();
  const missingClauses = [];

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;
  let totalScoreSum = 0;

  clauses.forEach((clause, index) => {
    let matchedAssessment = null;

    for (const rule of ROLE_AWARE_RULES) {
      const isMatch = rule.keywords.some((rx) => rx.test(clause.text));
      if (isMatch) {
        const assessment = rule.evaluate(clause.text, userRole, docType);
        if (!matchedAssessment || assessment.riskScore > matchedAssessment.riskScore) {
          matchedAssessment = {
            category: rule.category,
            ...assessment,
          };
        }
      }
    }

    if (!matchedAssessment) {
      matchedAssessment = {
        title: `Clause ${clause.originalOrder || index + 1}: General Terms`,
        category: 'General Contractual Provisions',
        risk: 'Low',
        riskScore: 20,
        reason:
          'Contains standard commercial terms, recitals, or administrative language without obvious high-risk exposure for your role.',
        whyItMatters: `Standard operational clause benchmarked for ${userRole}.`,
        impact: {
          financial: 'Standard commercial risk.',
          legal: 'Customary contractual provision.',
          operational: 'Routine business compliance.',
        },
        suggestedAction: 'Review for procedural alignment.',
        flags: { isMissing: false, isAmbiguous: false, isUnusual: false, isOneSided: false },
        suggestion: '',
        saferAlternative: '',
        priority: 'Low',
        recommendLegalReview: false,
        riskFactors: ['Administrative Term'],
        confidence: 0.9,
      };
    }

    const risk = matchedAssessment.risk || 'Low';
    const riskScore = matchedAssessment.riskScore || 20;
    totalScoreSum += riskScore;

    if (risk === 'Critical') {
      criticalCount++;
      redFlagsSet.add(`${matchedAssessment.category}: ${matchedAssessment.title} — ${matchedAssessment.reason.split('.')[0]}.`);
    } else if (risk === 'High') {
      highCount++;
      redFlagsSet.add(`${matchedAssessment.category}: ${matchedAssessment.title} — ${matchedAssessment.reason.split('.')[0]}.`);
    } else if (risk === 'Medium') {
      mediumCount++;
    } else if (risk === 'Informational') {
      infoCount++;
    } else {
      lowCount++;
    }

    analyzedClauses.push({
      id: clause.id || `clause-${index + 1}`,
      title: matchedAssessment.title || `Clause ${index + 1}`,
      text: clause.text,
      originalOrder: clause.originalOrder ?? index + 1,
      risk,
      riskScore,
      category: matchedAssessment.category,
      reason: matchedAssessment.reason,
      whyItMatters: matchedAssessment.whyItMatters || '',
      impact: matchedAssessment.impact || { financial: '', legal: '', operational: '' },
      suggestedAction: matchedAssessment.suggestedAction || '',
      flags: matchedAssessment.flags || { isMissing: false, isAmbiguous: false, isUnusual: false, isOneSided: false },
      suggestion: matchedAssessment.suggestion || '',
      saferAlternative: matchedAssessment.saferAlternative || '',
      negotiation: {
        clarify: `Clarify specific mutual obligations and terms under ${matchedAssessment.title}.`,
        negotiate: matchedAssessment.suggestion || 'Request reasonable, balanced terms standard in Indian contracting.',
        why: matchedAssessment.whyItMatters || 'Protects against unbalanced liability or delayed payments.',
        alternativeWording: matchedAssessment.saferAlternative || '',
        priority: matchedAssessment.priority || 'Medium',
        recommendLegalReview: matchedAssessment.recommendLegalReview || false,
      },
      riskFactors: matchedAssessment.riskFactors || [],
      confidence: matchedAssessment.confidence || 0.92,
      supportingText: clause.text.slice(0, 150),
    });
  });

  // Check missing clauses deterministically
  const fullText = clauses.map((c) => c.text).join(' ');
  if (!/(?:cure\s+period|14\s+days\s+to\s+cure|30\s+days\s+to\s+cure)/i.test(fullText)) {
    missingClauses.push({
      title: 'Missing Breach Cure Period',
      description: 'The contract permits immediate termination for breach without providing a standard written notice and opportunity to cure defects.',
      whyItMatters: 'Without a cure period, inadvertent technical errors can trigger immediate contract cancellation and claims for damages.',
      suggestedAddition: 'In the event of an alleged breach, the non-breaching party shall provide written notice specifying the breach, and the defaulting party shall have fourteen (14) days to cure such breach.',
      riskLevel: 'High',
    });
  }

  if (userRole === 'freelancer' && !/(?:upon\s+(?:full\s+)?payment.*transfer)/i.test(fullText)) {
    missingClauses.push({
      title: 'Missing Payment-Conditioned IP Transfer Clause',
      description: 'There is no explicit provision stating that intellectual property ownership transfers strictly upon receipt of full payment.',
      whyItMatters: 'Ensures the client cannot legally claim ownership of your work if they default on their invoices.',
      suggestedAddition: 'Title to and ownership of all custom deliverables shall transfer to Client strictly upon receipt of full and final payment of all corresponding invoices.',
      riskLevel: 'High',
    });
  }

  // Calculate overall risk
  let overallRisk = 'Low';
  if (criticalCount > 0) overallRisk = 'Critical';
  else if (highCount > 0) overallRisk = 'High';
  else if (mediumCount > 0) overallRisk = 'Medium';

  // Calculate calibrated overall score
  const avgClauseScore = clauses.length > 0 ? Math.round(totalScoreSum / clauses.length) : 20;
  let overallRiskScore = avgClauseScore;
  if (criticalCount > 0) {
    overallRiskScore = Math.max(overallRiskScore, Math.min(100, 75 + criticalCount * 8));
  } else if (highCount > 0) {
    overallRiskScore = Math.max(overallRiskScore, Math.min(85, 55 + highCount * 6));
  } else if (mediumCount > 0) {
    overallRiskScore = Math.max(overallRiskScore, Math.min(60, 35 + mediumCount * 5));
  }

  // Summary
  const summary =
    overallRisk === 'Critical' || overallRisk === 'High'
      ? `This ${docType} contains ${criticalCount + highCount} critical/high-risk provision(s) that strongly favor the counterparty when evaluated for an Indian ${userRole}. Key exposures include restrictive covenants, one-sided liability, or payment risks. Negotiation is strongly recommended before signing.`
      : overallRisk === 'Medium'
      ? `This ${docType} is moderately balanced with ${mediumCount} clause(s) requiring attention or clarification, notably regarding payment terms, notice periods, or deliverable boundaries.`
      : `This ${docType} reflects relatively standard, customary terms with ${analyzedClauses.length} evaluated clauses and no major red flags identified.`;

  return {
    clauses: analyzedClauses,
    redFlags: Array.from(redFlagsSet),
    missingClauses,
    summary,
    overallRisk,
    overallRiskScore,
    riskDistribution: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      informational: infoCount,
    },
    analysisLimitations:
      'LexiGuard provides educational risk analysis benchmarked against Indian commercial contracting norms. It does not substitute for qualified legal counsel.',
  };
};
