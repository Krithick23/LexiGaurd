import path from 'path';
import fs from 'fs';
import Contract from '../models/Contract.js';
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

  const role = req.body.role || req.user.role || 'freelancer';
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
  const extractedText = await extractTextFromBuffer(buffer, originalname);

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
    ];
  }

  if (riskFilter && ['High', 'Medium', 'Low'].includes(riskFilter)) {
    query.overallRisk = riskFilter;
  }

  const total = await Contract.countDocuments(query);
  const contracts = await Contract.find(query)
    .select('fileName label fileType overallRisk analysisStatus roleAtAnalysis createdAt redFlags clauses')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Add clause counts for history cards
  const transformed = contracts.map((c) => ({
    ...c,
    clauseCount: c.clauses?.length || 0,
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
    .select('overallRisk clauses createdAt fileName label')
    .sort({ createdAt: -1 })
    .lean();

  const totalContracts = contracts.length;
  let totalHighRiskClauses = 0;
  let totalMediumRiskClauses = 0;
  let totalLowRiskClauses = 0;

  const riskDistribution = {
    High: 0,
    Medium: 0,
    Low: 0,
  };

  contracts.forEach((c) => {
    if (riskDistribution[c.overallRisk] !== undefined) {
      riskDistribution[c.overallRisk]++;
    }

    if (Array.isArray(c.clauses)) {
      c.clauses.forEach((cl) => {
        if (cl.risk === 'High') totalHighRiskClauses++;
        else if (cl.risk === 'Medium') totalMediumRiskClauses++;
        else if (cl.risk === 'Low') totalLowRiskClauses++;
      });
    }
  });

  const recentContracts = contracts.slice(0, 5).map((c) => ({
    _id: c._id,
    fileName: c.fileName,
    label: c.label,
    overallRisk: c.overallRisk,
    createdAt: c.createdAt,
    clauseCount: c.clauses?.length || 0,
  }));

  res.status(200).json({
    success: true,
    stats: {
      totalContracts,
      totalHighRiskClauses,
      totalMediumRiskClauses,
      totalLowRiskClauses,
      riskDistribution: [
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
  const role = req.body.role || req.user.role || 'freelancer';

  let sampleFilename = 'sample_toxic_freelance_agreement.txt';
  let displayName = 'Sample Predatory Freelance Agreement.txt';
  let label = 'Toxic Clauses Demo';

  if (sampleType === 'negotiated' || sampleType === 'fair') {
    sampleFilename = 'sample_negotiated_freelance_agreement.txt';
    displayName = 'Sample Negotiated Fair Freelance Agreement.txt';
    label = 'Negotiated Draft Demo';
  }

  const samplePath = path.resolve('..', 'samples', sampleFilename);
  let sampleText = '';

  if (fs.existsSync(samplePath)) {
    sampleText = fs.readFileSync(samplePath, 'utf-8');
  } else {
    // Direct fallback text
    sampleText = `INDEPENDENT CONTRACTOR AGREEMENT
1. NON-COMPETE: Contractor agrees not to provide software services to any entity in India for 36 months after termination.
2. PAYMENT: Company shall pay within 90 days of subjective invoice approval. Company may withhold fees at will.
3. IP ASSIGNMENT: Contractor assigns all inventions and pre-existing side projects immediately upon creation before payment.
4. INDEMNITY: Contractor shall indemnify Company with unlimited liability. Company liability capped at INR 1,000.`;
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
