import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import contractApi from '../api/contractApi.js';
import {
  FileText,
  ArrowLeft,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Calendar,
  User,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge.jsx';
import ClauseCard from '../components/ClauseCard.jsx';
import RedFlagSummary from '../components/RedFlagSummary.jsx';
import LegalDisclaimer from '../components/LegalDisclaimer.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export const Analysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('original'); // 'original' or 'risk'
  const [expandAll, setExpandAll] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const fetchContract = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contractApi.getContractById(id);
      if (data.success && data.contract) {
        setContract(data.contract);
      } else {
        setError('Contract not found or unauthorized.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load contract analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [id]);

  // PDF Export
  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      // Use html2pdf.js dynamically
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `LexiGuard_Analysis_${contract?.fileName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Contract'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (pdfErr) {
      console.warn('html2pdf export failed, falling back to window.print():', pdfErr);
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState message="Loading detailed contract analysis workspace..." />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorMessage message={error || 'Contract analysis could not be located.'} onRetry={fetchContract} />
      </div>
    );
  }

  const clauses = contract.clauses || [];
  const highRiskCount = clauses.filter((c) => c.risk === 'High').length;
  const mediumRiskCount = clauses.filter((c) => c.risk === 'Medium').length;
  const lowRiskCount = clauses.filter((c) => c.risk === 'Low').length;

  // Filter clauses
  let filteredClauses = clauses.filter((clause) => {
    const matchesRisk = riskFilter === 'ALL' || clause.risk === riskFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      clause.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.suggestion?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  // Sort clauses
  if (sortBy === 'risk') {
    const riskWeight = { High: 3, Medium: 2, Low: 1 };
    filteredClauses.sort((a, b) => (riskWeight[b.risk] || 0) - (riskWeight[a.risk] || 0));
  } else {
    filteredClauses.sort((a, b) => (a.originalOrder || 0) - (b.originalOrder || 0));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {contract.fileName}
            </h1>
            <RiskBadge risk={contract.overallRisk} size="lg" />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {contract.label && (
              <span className="bg-brand-50 text-brand-700 font-semibold px-2.5 py-0.5 rounded-full border border-brand-200">
                {contract.label}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              <span>
                Analyzed on{' '}
                {new Date(contract.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User size={13} />
              <span className="capitalize">Perspective: {contract.roleAtAnalysis}</span>
            </span>
            <span>•</span>
            <span className="uppercase text-[11px] font-semibold">{contract.fileType} Format</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <Link
            to="/compare"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-subtle transition-colors"
          >
            <span>Compare Versions</span>
          </Link>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Download size={14} />
            <span>{exportingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Wrapper */}
      <div ref={reportRef} className="space-y-8">
        {/* Overview & Executive Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Executive Summary */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Sparkles size={18} className="text-brand-600" />
              <span>Plain-Language Executive Summary</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {contract.summary}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <Shield size={14} className="text-brand-500" />
              <span>Benchmarked for Indian {contract.roleAtAnalysis} legal and commercial risks.</span>
            </div>
          </div>

          {/* Risk Tally Counts */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Clause Risk Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 border border-red-100">
                <span className="text-xs font-bold text-red-800">High-Risk Traps</span>
                <span className="text-base font-extrabold text-red-700">{highRiskCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-xs font-bold text-amber-800">Medium-Risk Concerns</span>
                <span className="text-base font-extrabold text-amber-700">{mediumRiskCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800">Low-Risk / Customary</span>
                <span className="text-base font-extrabold text-emerald-700">{lowRiskCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Red Flags Box */}
        <RedFlagSummary redFlags={contract.redFlags} overallRisk={contract.overallRisk} />

        {/* Clause Analysis Section with Search & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Individual Clause Analysis ({filteredClauses.length} of {clauses.length})
              </h2>
              <p className="text-xs text-slate-500">
                Expand each clause to review why it matters, negotiation counter-points, and safer alternative wording.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setExpandAll(!expandAll)}
              className="self-start sm:self-auto text-xs font-semibold text-brand-600 hover:text-brand-700 no-print"
            >
              {expandAll ? 'Collapse All Clauses' : 'Expand All Clauses'}
            </button>
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center gap-3 no-print">
            {/* Search input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clause text, reasons, or category (e.g. non-compete, payment)..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            {/* Risk Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'High', 'Medium', 'Low'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                    riskFilter === r
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'ALL' ? 'All Risks' : `${r} (${clauses.filter((c) => c.risk === r).length})`}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-brand-600"
              >
                <option value="original">Original Contract Order</option>
                <option value="risk">Risk Severity (High first)</option>
              </select>
            </div>
          </div>

          {/* Clause Cards List */}
          {filteredClauses.length > 0 ? (
            <div className="space-y-3.5">
              {filteredClauses.map((clause, idx) => (
                <ClauseCard
                  key={clause.id || idx}
                  clause={clause}
                  index={idx}
                  isExpandedDefault={expandAll || clause.risk === 'High'}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              No clauses found matching your search and filter criteria.
            </div>
          )}
        </div>

        {/* Legal Disclaimer */}
        <LegalDisclaimer />
      </div>
    </div>
  );
};

export default Analysis;
