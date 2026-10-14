import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import contractApi from '../api/contractApi.js';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import FileUploader from '../components/FileUploader.jsx';
import RoleSelector from '../components/RoleSelector.jsx';
import LegalDisclaimer from '../components/LegalDisclaimer.jsx';

export const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [role, setRole] = useState(user?.role || 'freelancer');
  const [label, setLabel] = useState('');
  const [discardRawText, setDiscardRawText] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [statusText, setStatusText] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a contract file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(10);
    setStatusText('Uploading document to secure memory...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', role);
    if (label.trim()) formData.append('label', label.trim());
    formData.append('discardRawText', discardRawText);

    try {
      const data = await contractApi.uploadAndAnalyze(formData, (percent) => {
        setUploadProgress(Math.min(percent, 80));
        if (percent >= 80) {
          setStatusText('Extracting text and segmenting clauses...');
        }
      });

      setUploadProgress(100);
      setStatusText('Analysis completed!');

      if (data.success && data.contract?._id) {
        navigate(`/analysis/${data.contract._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze contract. Please verify document readability.');
      setIsUploading(false);
    }
  };

  const handleLoadSample = async (sampleType) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(40);
    setStatusText(`Loading sample ${sampleType === 'toxic' ? 'predatory' : 'negotiated'} agreement...`);

    try {
      const data = await contractApi.loadSampleContract(sampleType, role);
      setUploadProgress(100);
      if (data.success && data.contract?._id) {
        navigate(`/analysis/${data.contract._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to load sample contract.');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Upload & Analyze Contract
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Upload your agreement in PDF, DOCX, or TXT format. Our pipeline segments clauses and benchmarks risks for your role.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm shadow-subtle">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      {/* Main Upload Form */}
      <form onSubmit={handleUpload} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-card space-y-6">
        {/* Step 1: File Uploader */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Document File (PDF, DOCX, TXT)
          </label>
          <FileUploader
            file={file}
            onFileSelect={(f) => setFile(f)}
            onFileRemove={() => setFile(null)}
            disabled={isUploading}
            maxSizeMB={10}
          />
        </div>

        {/* Step 2: Role Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Review Perspective
          </label>
          <RoleSelector
            value={role}
            onChange={(r) => setRole(r)}
            label=""
          />
        </div>

        {/* Step 3: Optional Label & Privacy settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contract Label / Client Name (Optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Apex Global MSA v1"
              disabled={isUploading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors text-xs text-slate-700">
              <input
                type="checkbox"
                checked={discardRawText}
                onChange={(e) => setDiscardRawText(e.target.checked)}
                disabled={isUploading}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <div>
                <span className="font-semibold text-slate-800">Privacy Mode:</span> Discard raw text after analysis
              </div>
            </label>
          </div>
        </div>

        {/* Privacy Note Before Upload */}
        <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-100 flex items-start gap-2.5 text-xs text-brand-900">
          <Lock size={15} className="shrink-0 text-brand-600 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Privacy Guarantee:</strong> Documents are extracted in temporary RAM. No binary files are stored on server disks or MongoDB. Only extracted clause text and structured risk ratings are retained.
          </p>
        </div>

        {/* Progress Bar (during upload/analysis) */}
        {isUploading && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-brand-600" />
                <span>{statusText || 'Processing agreement...'}</span>
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-highlight transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Analyzing Agreement...</span>
            </>
          ) : (
            <>
              <UploadCloud size={18} />
              <span>Start Risk Analysis</span>
            </>
          )}
        </button>
      </form>

      {/* 1-Click Interactive Sample Demos */}
      <div className="bg-slate-100/80 rounded-2xl p-6 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Sparkles size={16} className="text-brand-600" />
          <span>Don't have a document file right now? Try a pre-built sample:</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Test LexiGuard immediately with realistic contracts containing real predatory or negotiated terms:
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleLoadSample('toxic')}
            disabled={isUploading}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-red-50 text-red-700 border border-red-200 shadow-subtle transition-colors flex items-center justify-center gap-2"
          >
            <span>Sample 1: Predatory Toxic Freelance Contract</span>
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('negotiated')}
            disabled={isUploading}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-subtle transition-colors flex items-center justify-center gap-2"
          >
            <span>Sample 2: Revised Fair Freelance Contract</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <LegalDisclaimer compact />
    </div>
  );
};

export default Upload;
