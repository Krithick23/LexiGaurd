import path from 'path';
import fs from 'fs';
import Contract from '../models/Contract.js';
import { normalizeRole } from '../models/User.js';
import { extractTextFromBuffer } from '../services/extractText.js';
import { validateFileSignature } from '../middleware/uploadMiddleware.js';
import { analyzeContractPipeline } from '../services/scoreRisk.js';
import { compareContractAnalyses } from '../services/compareContracts.js';
import asyncHandler from '../utils/asyncHandler.js';

const MAX_CONTRACTS_PER_USER = parseInt(process.env.MAX_CONTRACTS_PER_USER || '100', 10);

/**
 * @desc    Upload document, extract text, and run AI risk analysis
 * @route   POST /api/contracts/upload
 * @access  Private
 */
export const uploadAndAnalyze = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No contract file uploaded. Please upload a PDF, DOCX, or text agreement.',
    });
  }

  // 1. Check storage cap per user
  const userContractCount = await Contract.countDocuments({ userId: req.user._id });
  if (userContractCount >= MAX_CONTRACTS_PER_USER) {
    return res.status(403).json({
      success: false,
      message: `Account storage limit reached (${MAX_CONTRACTS_PER_USER} contracts). Please remove older analyses in your History to upload new ones.`,
    });
  }

  const { originalname, buffer } = req.file;
  const ext = path.extname(originalname).toLowerCase();

  // 2. Validate file signature (magic bytes)
  const sigValidation = validateFileSignature(buffer, originalname);
  if (!sigValidation.valid) {
    return res.status(400).json({
      success: false,
      message: sigValidation.message,
    });
  }

  // Authoritative role is retrieved strictly from the authenticated user's DB record
  const role = normalizeRole(req.user?.role || 'freelancer');
  const label = req.body.label ? req.body.label.trim() : '';
  const discardRawText = req.body.discardRawText === 'true' || req.body.discardRawText === true;

  const fileTypeMap = {
    '.pdf': 'PDF',
    '.docx': 'DOCX',
    '.doc': 'DOCX',
    '.txt': 'TXT',
  };
  const fileType = fileTypeMap[ext] || 'PDF';

  // 3. Extract text
  let extractedText;
  try {
    extractedText = await extractTextFromBuffer(buffer, originalname);
  } catch (extractErr) {
    return res.status(400).json({
      success: false,
      message: extractErr.message || 'Failed to extract readable text from uploaded document.',
    });
  }

  // 4. Run AI Analysis Pipeline
  const analysisResult = await analyzeContractPipeline(extractedText, role);

  // 5. Persist Contract to Database
  const contract = await Contract.create({
    userId: req.user._id,
    fileName: originalname,
    label,
    fileType,
    rawText: discardRawText ? '' : extractedText,
    discardRawText,
    summary: analysisResult.summary,
    overallRisk: analysisResult.overallRisk,
    overallRiskScore: analysisResult.overallRiskScore,
    detectedContractType: analysisResult.detectedContractType,
    contractClassification: analysisResult.contractClassification,
    riskDistribution: analysisResult.riskDistribution,
    missingClauses: analysisResult.missingClauses,
    analysisLimitations: analysisResult.analysisLimitations,
    clauses: analysisResult.clauses,
    redFlags: analysisResult.redFlags,
    analysisStatus: 'completed',
    roleAtAnalysis: role,
    modelUsed: analysisResult.modelUsed,
    analysisVersion: analysisResult.analysisVersion,
  });

  res.status(201).json({
    success: true,
    message: 'Contract analyzed successfully.',
    contract,
  });
});

/**
 * @desc    Get paginated contracts list for authenticated user
 * @route   GET /api/contracts
 * @access  Private
 */
export const getContracts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search ? req.query.search.trim() : '';
  const riskFilter = req.query.risk ? req.query.risk.trim() : '';

  const query = { userId: req.user._id };

  if (search) {
    query.$or = [
      { fileName: { $regex: search, $options: 'i' } },
      { label: { $regex: search, $options: 'i' } },
      { detectedContractType: { $regex: search, $options: 'i' } },
    ];
  }

  if (
    riskFilter &&
    ['Critical', 'High', 'Medium', 'Low', 'Informational'].includes(riskFilter)
  ) {
    query.overallRisk = riskFilter;
  }

  const total = await Contract.countDocuments(query);
  const contracts = await Contract.find(query)
    .select(
      'fileName label fileType overallRisk overallRiskScore detectedContractType riskDistribution analysisStatus roleAtAnalysis createdAt redFlags clauses'
    )
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Add clause counts for history cards
  const transformed = contracts.map((c) => ({
    ...c,
    clauseCount: c.clauses?.length || 0,
    criticalRiskCount: c.clauses?.filter((cl) => cl.risk === 'Critical').length || 0,
    highRiskCount: c.clauses?.filter((cl) => cl.risk === 'High').length || 0,
    mediumRiskCount: c.clauses?.filter((cl) => cl.risk === 'Medium').length || 0,
    lowRiskCount: c.clauses?.filter((cl) => cl.risk === 'Low').length || 0,
    clauses: undefined, // Omit heavy clause bodies from history list
  }));

  res.status(200).json({
    success: true,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    limit,
    contracts: transformed,
  });
});

/**
 * @desc    Get single contract analysis by ID
 * @route   GET /api/contracts/:id
 * @access  Private
 */
export const getContractById = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!contract) {
    return res.status(404).json({
      success: false,
      message: 'Contract analysis not found or access unauthorized.',
    });
  }

  res.status(200).json({
    success: true,
    contract,
  });
});

/**
 * @desc    Delete contract analysis
 * @route   DELETE /api/contracts/:id
 * @access  Private
 */
export const deleteContract = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!contract) {
    return res.status(404).json({
      success: false,
      message: 'Contract not found or access unauthorized.',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Contract analysis deleted successfully.',
  });
});

/**
 * @desc    Compare two saved contract analyses
 * @route   POST /api/contracts/compare
 * @access  Private
 */
export const compareContracts = asyncHandler(async (req, res, next) => {
  const { contractId1, contractId2 } = req.body;

  if (contractId1 === contractId2) {
    return res.status(400).json({
      success: false,
      message: 'Please select two different contract analyses to compare.',
    });
  }

  const [contract1, contract2] = await Promise.all([
    Contract.findOne({ _id: contractId1, userId: req.user._id }),
    Contract.findOne({ _id: contractId2, userId: req.user._id }),
  ]);

  if (!contract1 || !contract2) {
    return res.status(404).json({
      success: false,
      message: 'One or both of the contracts could not be found in your account.',
    });
  }

  const comparison = compareContractAnalyses(contract1, contract2);

  res.status(200).json({
    success: true,
    comparison,
  });
});

/**
 * @desc    Get dashboard metrics for authenticated user
 * @route   GET /api/contracts/stats
 * @access  Private
 */
export const getUserStats = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const contracts = await Contract.find({ userId })
    .select('overallRisk overallRiskScore clauses createdAt fileName label detectedContractType')
    .sort({ createdAt: -1 })
    .lean();

  const totalContracts = contracts.length;
  let totalCriticalRiskClauses = 0;
  let totalHighRiskClauses = 0;
  let totalMediumRiskClauses = 0;
  let totalLowRiskClauses = 0;
  let totalInfoClauses = 0;

  const riskDistribution = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Informational: 0,
  };

  contracts.forEach((c) => {
    if (riskDistribution[c.overallRisk] !== undefined) {
      riskDistribution[c.overallRisk]++;
    }

    if (Array.isArray(c.clauses)) {
      c.clauses.forEach((cl) => {
        if (cl.risk === 'Critical') totalCriticalRiskClauses++;
        else if (cl.risk === 'High') totalHighRiskClauses++;
        else if (cl.risk === 'Medium') totalMediumRiskClauses++;
        else if (cl.risk === 'Informational') totalInfoClauses++;
        else totalLowRiskClauses++;
      });
    }
  });

  const recentContracts = contracts.slice(0, 5).map((c) => ({
    _id: c._id,
    fileName: c.fileName,
    label: c.label,
    overallRisk: c.overallRisk,
    overallRiskScore: c.overallRiskScore || 25,
    detectedContractType: c.detectedContractType || 'Contract',
    createdAt: c.createdAt,
    clauseCount: c.clauses?.length || 0,
  }));

  res.status(200).json({
    success: true,
    stats: {
      totalContracts,
      totalCriticalRiskClauses,
      totalHighRiskClauses,
      totalMediumRiskClauses,
      totalLowRiskClauses,
      riskDistribution: [
        { name: 'Critical Risk', value: riskDistribution.Critical, color: '#DC2626' },
        { name: 'High Risk', value: riskDistribution.High, color: '#EF4444' },
        { name: 'Medium Risk', value: riskDistribution.Medium, color: '#F59E0B' },
        { name: 'Low Risk', value: riskDistribution.Low, color: '#10B981' },
      ],
      recentContracts,
    },
  });
});

/**
 * @desc    Load and analyze a pre-built sample contract for instant 1-click testing
 * @route   POST /api/contracts/sample-demo
 * @access  Private
 */
export const loadSampleContract = asyncHandler(async (req, res, next) => {
  const sampleType = req.body.sampleType || 'toxic';
  // Strictly enforce user's registered role from DB (ignore any role passed in request)
  const role = normalizeRole(req.user?.role || 'freelancer');

  let displayName = '';
  let label = '';
  let sampleText = '';

  if (role === 'employee') {
    if (sampleType === 'negotiated' || sampleType === 'fair') {
      displayName = 'Fair Internship & Employment Agreement (Demo).txt';
      label = 'Fair Employment Demo';
      sampleText = `INTERNSHIP AND APPOINTMENT AGREEMENT
1. APPOINTMENT: Company appoints Candidate as Software Engineering Intern with structured learning goals.
2. STIPEND: Company shall pay a fixed monthly stipend of INR 35,000 disbursed on the 1st of each calendar month.
3. WORKING HOURS: Standard 40 hours per week, Monday through Friday, 9:30 AM to 6:00 PM. No unpaid overtime.
4. NOTICE PERIOD: Either party may terminate this internship upon fourteen (14) days prior written notice.
5. INTELLECTUAL PROPERTY: Company owns deliverables created during work hours for Company projects. Candidate retains all rights to personal inventions created on off-hours without Company data.
6. COMPLETION: Candidate shall receive an official internship completion and experience certificate upon completion.`;
    } else {
      displayName = 'Predatory Internship & Training Bond Agreement (Demo).txt';
      label = 'Predatory Employment Demo';
      sampleText = `EMPLOYMENT AND INTERNSHIP AGREEMENT
1. TRAINING BOND: Candidate agrees to serve Company for a mandatory period of 24 months. If Candidate resigns early for any reason, Candidate must pay liquidated damages of INR 2,00,000 immediately.
2. CERTIFICATES: Company shall retain Candidate’s original academic certificates and will withhold experience letters upon early departure.
3. NOTICE PERIOD: Employee must give ninety (90) days written notice with no option for buyout. Company may terminate immediately at will.
4. INTELLECTUAL PROPERTY: Employee assigns all inventions, source code, and side projects created at any time, whether on personal devices or outside work hours.
5. NON-COMPETE: Employee shall not accept employment with any technology firm in India for twenty-four (24) months post-exit.
6. STIPEND DEDUCTION: Company reserves the right to withhold monthly stipend in its sole subjective discretion.`;
    }
  } else if (role === 'small_business') {
    if (sampleType === 'negotiated' || sampleType === 'fair') {
      displayName = 'Fair Vendor Services Agreement (Demo).txt';
      label = 'Fair Vendor Demo';
      sampleText = `MASTER VENDOR SERVICES AGREEMENT
1. PAYMENT TERMS: Client shall pay undisputed invoices within thirty (30) days of receipt. Late payments shall accrue interest at 1% per month.
2. DEPOSIT: Client shall pay an advance deposit of 30% prior to commencement of vendor services.
3. LIABILITY CAP: Each party's aggregate liability under this Agreement shall be limited to the total fees paid in the preceding twelve (12) months.
4. WARRANTIES: Vendor warrants that services shall be performed in a professional manner conforming to specifications.
5. TERMINATION: Either party may terminate with thirty (30) days notice. Client shall compensate Vendor for all work-in-progress.`;
    } else {
      displayName = 'Predatory Enterprise Vendor Agreement (Demo).txt';
      label = 'Predatory Vendor Demo';
      sampleText = `ENTERPRISE VENDOR MASTER AGREEMENT
1. AUTO-RENEWAL: This agreement shall automatically renew for additional 24-month terms unless Vendor gives written cancellation notice exactly 120 days prior to term expiry.
2. PAYMENT DELAY: Enterprise shall pay within 120 days of invoice receipt and may withhold or discount fees in its sole discretion.
3. PRICE ESCALATION: Enterprise reserves the right to demand price reductions of 15% annually without modifying deliverable scope.
4. UNLIMITED LIABILITY: Vendor agrees to indemnify Enterprise against all claims with unlimited liability. Enterprise liability is capped at INR 1,000.
5. EXCLUSIVITY: Vendor agrees not to provide software or marketing services to any other entity in the retail sector in India.`;
    }
  } else if (role === 'founder') {
    if (sampleType === 'negotiated' || sampleType === 'fair') {
      displayName = 'Balanced Co-Founder & Shareholders Agreement (Demo).txt';
      label = 'Fair Founder Demo';
      sampleText = `FOUNDERS AND SHAREHOLDERS AGREEMENT
1. EQUITY ALLOCATION: Founders receive equity vesting over four (4) years with a one (1) year cliff and monthly vesting thereafter.
2. GOOD LEAVER: A Founder who leaves after two (2) years of service shall be designated a Good Leaver and shall retain all vested shares.
3. VESTING ACCELERATION: 100% of unvested shares shall accelerate upon a change of control or corporate acquisition.
4. IP ASSIGNMENT: All founders irrevocably assign all pre-incorporation and future company technology to the corporate entity.
5. BOARD GOVERNANCE: Fundamental corporate decisions require affirmative majority vote of the Board of Directors.`;
    } else {
      displayName = 'Predatory Term Sheet & Shareholder Lockup (Demo).txt';
      label = 'Predatory Term Sheet Demo';
      sampleText = `INVESTOR TERM SHEET AND SHAREHOLDER AGREEMENT
1. BAD LEAVER FORFEITURE: If a Founder departs the company for any reason including voluntary resignation, all vested and unvested shares shall be surrendered to investors at nominal par value of INR 1 per share.
2. FULL RATCHET DILUTION: Investors shall receive full-ratchet anti-dilution protection with zero founder dilution floor in any down round.
3. LIQUIDATION PREFERENCE: Participating preferred liquidation preference of 3x investment amount plus pro-rata common distribution before founders receive any proceeds.
4. UNILATERAL VETO: Investor director holds sole veto power over all operational hires, marketing budgets, and commercial contracts.
5. PERSONAL INDEMNITY: Founders personally guarantee all representations and warranties with unlimited personal liability.`;
    }
  } else {
    // Default Freelancer
    if (sampleType === 'negotiated' || sampleType === 'fair') {
      displayName = 'Sample Negotiated Fair Freelance Agreement.txt';
      label = 'Negotiated Draft Demo';
      sampleText = `INDEPENDENT CONTRACTOR AGREEMENT
1. SCOPE AND REVISIONS: Contractor agrees to deliver web application milestones. Deliverables include two (2) rounds of revisions. Additional revisions shall be billed at agreed hourly rates.
2. PAYMENT TERMS: Client shall pay within fifteen (15) days of undisputed invoice submission. Undisputed late balances shall accrue 1.5% monthly interest.
3. IP OWNERSHIP: Title to custom deliverables transfers to Client strictly upon receipt of full and final payment. Contractor retains all ownership of pre-existing background code and development tools.
4. PORTFOLIO RIGHTS: Contractor may display non-confidential project screenshots and case studies in Contractor's professional portfolio.
5. TERMINATION: Either party may terminate upon fourteen (14) days prior written notice. Client shall pay for all work completed up to the termination date.
6. LIABILITY: Each party's liability is mutually capped at the total fees paid under this Agreement.`;
    } else {
      displayName = 'Sample Predatory Freelance Agreement.txt';
      label = 'Toxic Clauses Demo';
      sampleText = `INDEPENDENT CONTRACTOR AGREEMENT
1. NON-COMPETE: Contractor agrees not to provide software services to any entity in India for 36 months after termination.
2. PAYMENT: Company shall pay within 90 days of subjective invoice approval. Company may withhold fees at will.
3. IP ASSIGNMENT: Contractor assigns all inventions and pre-existing side projects immediately upon creation before payment.
4. INDEMNITY: Contractor shall indemnify Company with unlimited liability. Company liability capped at INR 1,000.
5. JURISDICTION: This agreement shall be governed solely by the courts of Wilmington, Delaware, USA.`;
    }
  }

  const analysisResult = await analyzeContractPipeline(sampleText, role);

  const contract = await Contract.create({
    userId: req.user._id,
    fileName: displayName,
    label,
    fileType: 'TXT',
    rawText: sampleText,
    discardRawText: false,
    summary: analysisResult.summary,
    overallRisk: analysisResult.overallRisk,
    overallRiskScore: analysisResult.overallRiskScore,
    detectedContractType: analysisResult.detectedContractType,
    contractClassification: analysisResult.contractClassification,
    riskDistribution: analysisResult.riskDistribution,
    missingClauses: analysisResult.missingClauses,
    analysisLimitations: analysisResult.analysisLimitations,
    clauses: analysisResult.clauses,
    redFlags: analysisResult.redFlags,
    analysisStatus: 'completed',
    roleAtAnalysis: role,
    modelUsed: analysisResult.modelUsed,
    analysisVersion: analysisResult.analysisVersion,
  });

  res.status(201).json({
    success: true,
    message: 'Sample contract loaded and analyzed successfully.',
    contract,
  });
});
