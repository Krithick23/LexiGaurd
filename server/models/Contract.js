import mongoose from 'mongoose';

const clauseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: true,
      maxlength: [10000, 'Clause text exceeds maximum length of 10,000 characters'],
    },
    originalOrder: {
      type: Number,
      required: true,
    },
    risk: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
      default: 'Low',
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 20,
    },
    reason: {
      type: String,
      default: '',
    },
    whyItMatters: {
      type: String,
      default: '',
    },
    impact: {
      financial: { type: String, default: '' },
      legal: { type: String, default: '' },
      operational: { type: String, default: '' },
    },
    suggestedAction: {
      type: String,
      default: '',
    },
    flags: {
      isMissing: { type: Boolean, default: false },
      isAmbiguous: { type: Boolean, default: false },
      isUnusual: { type: Boolean, default: false },
      isOneSided: { type: Boolean, default: false },
    },
    suggestion: {
      type: String,
      default: '',
    },
    saferAlternative: {
      type: String,
      default: '',
    },
    negotiation: {
      clarify: { type: String, default: '' },
      negotiate: { type: String, default: '' },
      why: { type: String, default: '' },
      alternativeWording: { type: String, default: '' },
      priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
      recommendLegalReview: { type: Boolean, default: false },
    },
    riskFactors: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: 'General Terms',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.9,
    },
    supportingText: {
      type: String,
      default: '',
    },
    matchedClauseId: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
      maxlength: [255, 'Filename is too long'],
    },
    label: {
      type: String,
      trim: true,
      maxlength: [100, 'Label cannot exceed 100 characters'],
      default: '',
    },
    fileType: {
      type: String,
      enum: ['PDF', 'DOCX', 'TXT'],
      required: true,
    },
    rawText: {
      type: String,
      default: '',
      maxlength: [500000, 'Extracted text exceeds 500,000 character limit'],
    },
    summary: {
      type: String,
      default: 'Contract analysis summary pending.',
      maxlength: [5000, 'Summary exceeds character limit'],
    },
    overallRisk: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
      default: 'Low',
    },
    overallRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 20,
    },
    detectedContractType: {
      type: String,
      default: 'General Agreement',
    },
    contractClassification: {
      documentType: { type: String, default: 'General Agreement' },
      parties: { type: [String], default: [] },
      purpose: { type: String, default: '' },
      confidence: { type: Number, default: 0.9 },
      missingOrUnclearInfo: { type: [String], default: [] },
      classificationDetails: { type: String, default: '' },
    },
    riskDistribution: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      informational: { type: Number, default: 0 },
    },
    missingClauses: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        whyItMatters: { type: String, default: '' },
        suggestedAddition: { type: String, default: '' },
        riskLevel: { type: String, default: 'Medium' },
      },
    ],
    analysisLimitations: {
      type: String,
      default: '',
    },
    clauses: {
      type: [clauseSchema],
      default: [],
    },
    redFlags: {
      type: [String],
      default: [],
    },
    analysisStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    roleAtAnalysis: {
      type: String,
      enum: ['freelancer', 'employee', 'small_business', 'founder'],
      default: 'freelancer',
    },
    modelUsed: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    analysisVersion: {
      type: String,
      default: '2.0.0',
    },
    discardRawText: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user contracts sorted by date
contractSchema.index({ userId: 1, createdAt: -1 });
contractSchema.index({ userId: 1, overallRisk: 1 });

export const Contract = mongoose.model('Contract', contractSchema);
export default Contract;
