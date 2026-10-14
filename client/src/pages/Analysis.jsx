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
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  Briefcase,
  HelpCircle,
  FileQuestion,
  ChevronDown,
  ChevronUp,
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
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('original'); // 'original' or 'risk'
  const [expandAll, setExpandAll] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showLimitations, setShowLimitations] = useState(false);

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

  const roleDisplayNames = {
    freelancer: 'Freelancer',
    employee: 'Intern / Employee',
    small_business: 'Small Business Owner',
    founder: 'Founder / Startup Owner',
  };

  const readableRole =
    roleDisplayNames[contract.roleAtAnalysis] || contract.roleAtAnalysis || 'Contract Reviewer';

  const clauses = contract.clauses || [];

  // 5-tier risk counts
  const riskDist = contract.riskDistribution || {
    critical: clauses.filter((c) => c.risk === 'Critical').length,
    high: clauses.filter((c) => c.risk === 'High').length,
    medium: clauses.filter((c) => c.risk === 'Medium').length,
    low: clauses.filter((c) => c.risk === 'Low').length,
    informational: clauses.filter((c) => c.risk === 'Informational').length,
  };

  // Derive categories
  const categories = Array.from(new Set(clauses.map((c) => c.category).filter(Boolean)));

  // Filter clauses
  let filteredClauses = clauses.filter((clause) => {
    const matchesRisk = riskFilter === 'ALL' || clause.risk === riskFilter;
    const matchesCategory = categoryFilter === 'ALL' || clause.category === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      clause.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.whyItMatters?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.suggestion?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesCategory && matchesSearch;
  });

  // Sort clauses
  if (sortBy === 'risk') {
    const riskWeight = { Critical: 4, High: 3, Medium: 2, Low: 1, Informational: 0 };
    filteredClauses.sort((a, b) => {
      const diff = (riskWeight[b.risk] || 0) - (riskWeight[a.risk] || 0);
      if (diff !== 0) return diff;
      return (b.riskScore || 0) - (a.riskScore || 0);
    });
  } else {
    filteredClauses.sort((a, b) => (a.originalOrder || 0) - (b.originalOrder || 0));
  }

  const classification = contract.contractClassification || {};
  const isLowConfidence =
    classification.confidence !== undefined &&
    classification.confidence !== null &&
    classification.confidence < 0.65;

  const missingClauses = contract.missingClauses || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header / Breadcrumb / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
            >
              <Clock size={14} />
              <span>Contract History</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {contract.fileName}
            </h1>
            <RiskBadge risk={contract.overallRisk} size="lg" />
            {contract.overallRiskScore !== undefined && (
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-900 text-white shadow-sm">
                Score: {contract.overallRiskScore}/100
              </span>
            )}
          </div>

          {/* Metadata badges row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
            {contract.detectedContractType && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                <FileText size={12} />
                <span>Type: {contract.detectedContractType}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-800 font-bold px-2.5 py-0.5 rounded-full border border-brand-200">
              <User size={12} />
              <span>Review Perspective: {readableRole}</span>
            </span>

            {classification.confidence !== undefined && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-semibold ${
                  isLowConfidence
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                <span>Confidence: {Math.round(classification.confidence * 100)}%</span>
              </span>
            )}

            <span className="flex items-center gap-1 text-slate-500">
              <Calendar size={13} />
              <span>
                {new Date(contract.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </span>
            <span className="uppercase text-[11px] font-semibold text-slate-400">
              {contract.fileType}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <Link
            to="/compare"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-subtle transition-colors"
          >
            <Layers size={14} />
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
        {/* Low Confidence Warning Disclose */}
        {isLowConfidence && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-subtle">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                Classification Uncertainty Disclosed
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                The AI classification confidence for this document is{' '}
                <strong>{Math.round((classification.confidence || 0.5) * 100)}%</strong>.
                {classification.notes
                  ? ` Note: ${classification.notes}`
                  : ` This document may be a hybrid or non-standard agreement. LexiGuard applied comprehensive contract risk heuristics tailored to your registered ${readableRole} profile.`}
                {' '}Please review the extracted clauses carefully.
              </p>
            </div>
          </div>
        )}

        {/* Executive Summary & Contract Classification Context */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Executive Summary */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Sparkles size={18} className="text-brand-600" />
                <span>Executive Summary & Commercial Context</span>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                Evaluated as {readableRole}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {contract.summary}
            </p>

            {/* Classification details */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {classification.partiesInvolved && classification.partiesInvolved.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-700 block mb-0.5">Parties Identified:</span>
                  <span className="text-slate-600">{classification.partiesInvolved.join(' • ')}</span>
                </div>
              )}
              {classification.likelyPurpose && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-700 block mb-0.5">Agreement Purpose:</span>
                  <span className="text-slate-600">{classification.likelyPurpose}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <Shield size={14} className="text-brand-600 shrink-0" />
              <span>
                Benchmarked specifically against Indian contract law, IT/commercial practices, and {readableRole} rights.
              </span>
            </div>
          </div>

          {/* 5-tier Risk Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Risk Distribution
              </h3>
              <span className="text-xs font-extrabold text-slate-900">
                Score: {contract.overallRiskScore ?? 0}/100
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-100/70 border border-red-200">
                <span className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                  <AlertOctagon size={13} className="text-red-700" />
                  <span>Critical Traps</span>
                </span>
                <span className="text-sm font-extrabold text-red-800">{riskDist.critical || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/70 border border-red-100">
                <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-500" />
                  <span>High-Risk Clauses</span>
                </span>
                <span className="text-sm font-extrabold text-red-700">{riskDist.high || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-500" />
                  <span>Medium Concerns</span>
                </span>
                <span className="text-sm font-extrabold text-amber-700">{riskDist.medium || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Low-Risk / Standard</span>
                </span>
                <span className="text-sm font-extrabold text-emerald-700">{riskDist.low || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <Info size={13} className="text-blue-600" />
                  <span>Informational</span>
                </span>
                <span className="text-sm font-extrabold text-blue-700">{riskDist.informational || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Red Flags Box */}
        <RedFlagSummary redFlags={contract.redFlags} overallRisk={contract.overallRisk} />

        {/* Missing or Omitted Protective Provisions Card */}
        {missingClauses.length > 0 && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 sm:p-7 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileQuestion size={20} className="text-amber-700" />
                <h3 className="font-bold text-base text-amber-950">
                  Missing or Omitted Protections ({missingClauses.length})
                </h3>
              </div>
              <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                Important Omissions
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              These provisions are standard safeguards for a {readableRole} but were not found in the uploaded contract:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {missingClauses.map((missing, idx) => (
                <div
                  key={idx}
                  className="bg-white/95 rounded-2xl border border-amber-200/80 p-4 space-y-2 shadow-subtle"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{missing.title}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        missing.severity === 'high'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {missing.severity || 'Medium'} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{missing.description}</p>
                  {missing.whyItMatters && (
                    <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg">
                      <strong>Why you need it:</strong> {missing.whyItMatters}
                    </div>
                  )}
                  {missing.suggestedAddition && (
                    <div className="text-[11px] text-brand-900 bg-brand-50/60 border border-brand-100 p-2 rounded-lg">
                      <strong>Suggested draft addition:</strong> "{missing.suggestedAddition}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clause Analysis Section with Search & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Individual Clause Breakdown ({filteredClauses.length} of {clauses.length})
              </h2>
              <p className="text-xs text-slate-500">
                Analyzed from your authenticated account perspective as a <strong>{readableRole}</strong>.
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
                placeholder="Search clause text, title, risk reason, or suggested action..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            {/* Risk Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'Critical', 'High', 'Medium', 'Low', 'Informational'].map((r) => {
                const count =
                  r === 'ALL'
                    ? clauses.length
                    : r === 'Critical'
                    ? riskDist.critical || 0
                    : r === 'High'
                    ? riskDist.high || 0
                    : r === 'Medium'
                    ? riskDist.medium || 0
                    : r === 'Low'
                    ? riskDist.low || 0
                    : riskDist.informational || 0;

                return (
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
                    {r === 'ALL' ? 'All Risks' : `${r} (${count})`}
                  </button>
                );
              })}
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-brand-600"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-brand-600"
              >
                <option value="original">Original Order</option>
                <option value="risk">Risk Severity</option>
              </select>
            </div>
          </div>

          {/* Clause Cards List */}
          {filteredClauses.length > 0 ? (
            <div className="space-y-3.5">
              {filteredClauses.map((clause, idx) => (
                <ClauseCard
                  key={clause._id || clause.id || idx}
                  clause={clause}
                  index={idx}
                  isExpandedDefault={expandAll || clause.risk === 'Critical' || clause.risk === 'High'}
                  userRole={contract.roleAtAnalysis}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              No clauses found matching your search and filter criteria.
            </div>
          )}
        </div>

        {/* Analysis Limitations Accordion */}
        {contract.analysisLimitations && contract.analysisLimitations.length > 0 && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setShowLimitations(!showLimitations)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <HelpCircle size={15} className="text-slate-500" />
                <span>AI Scope & Analysis Limitations ({contract.analysisLimitations.length})</span>
              </div>
              {showLimitations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showLimitations && (
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600 pl-4 list-disc">
                {contract.analysisLimitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Legal Disclaimer */}
        <LegalDisclaimer />
      </div>
    </div>
  );
};

export default Analysis;
