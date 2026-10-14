import mongoose from 'mongoose';

const clauseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
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
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    reason: {
      type: String,
      default: '',
    },
    suggestion: {
      type: String,
      default: '',
    },
    saferAlternative: {
      type: String,
      default: '',
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
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
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
      enum: ['freelancer', 'employee', 'founder'],
      default: 'freelancer',
    },
    modelUsed: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    analysisVersion: {
      type: String,
      default: '1.0.0',
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
