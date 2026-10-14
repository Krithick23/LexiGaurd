import React, { useState, useEffect } from 'react';
import contractApi from '../api/contractApi.js';
import {
  GitCompare,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';

export const Compare = () => {
  const [contractsList, setContractsList] = useState([]);
  const [contractId1, setContractId1] = useState('');
  const [contractId2, setContractId2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all user contracts for dropdown select
  useEffect(() => {
    const loadContracts = async () => {
      setFetchingList(true);
      try {
        const data = await contractApi.getContracts({ limit: 50 });
        if (data.success && data.contracts) {
          setContractsList(data.contracts);
          if (data.contracts.length >= 2) {
            setContractId1(data.contracts[1]._id);
            setContractId2(data.contracts[0]._id);
          } else if (data.contracts.length === 1) {
            setContractId1(data.contracts[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load contracts list:', err);
      } finally {
        setFetchingList(false);
      }
    };

    loadContracts();
  }, []);

  const handleCompare = async () => {
    if (!contractId1 || !contractId2) {
      setError('Please select two contracts to compare.');
      return;
    }
    if (contractId1 === contractId2) {
      setError('Please select two distinct contracts to compare.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await contractApi.compareContracts(contractId1, contractId2);
      if (data.success && data.comparison) {
        setComparison(data.comparison);
      }
    } catch (err) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Contract Version Comparison
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track clause modifications, detect newly introduced risks, and verify if previous red flags were successfully negotiated.
        </p>
      </div>

      {/* Contract Selectors Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Select Two Contracts to Compare
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contract 1 (Original / Draft A) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Original Contract (Draft A)
            </label>
            <select
              value={contractId1}
              onChange={(e) => setContractId1(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            >
              <option value="">-- Choose Original Draft --</option>
              {contractsList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.fileName} {c.label ? `(${c.label})` : ''} — {c.overallRisk} Risk
                </option>
              ))}
            </select>
          </div>

          {/* Contract 2 (Revised / Draft B) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Revised Contract (Draft B)
            </label>
            <select
              value={contractId2}
              onChange={(e) => setContractId2(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            >
              <option value="">-- Choose Revised Draft --</option>
              {contractsList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.fileName} {c.label ? `(${c.label})` : ''} — {c.overallRisk} Risk
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCompare}
          disabled={!contractId1 || !contractId2 || contractId1 === contractId2 || loading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all disabled:opacity-50"
        >
          <GitCompare size={16} />
          <span>{loading ? 'Running Semantic Diff...' : 'Run Contract Comparison'}</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && <LoadingState message="Comparing clause semantics, tracking modifications and risk shifts..." />}

      {/* Comparison Results */}
      {comparison && !loading && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-extrabold text-emerald-700">
                {comparison.metrics?.resolvedRisksCount || 0}
              </span>
              <span className="text-xs font-semibold text-emerald-900">Risks Resolved</span>
            </div>

            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-extrabold text-red-700">
                {comparison.metrics?.newRisksCount || 0}
              </span>
              <span className="text-xs font-semibold text-red-900">New Risks Introduced</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-extrabold text-amber-700">
                {comparison.metrics?.persistentRisksCount || 0}
              </span>
              <span className="text-xs font-semibold text-amber-900">Persistent Risks</span>
            </div>

            <div className="bg-brand-50/70 border border-brand-200 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-extrabold text-brand-700">
                {comparison.metrics?.modifiedCount || 0}
              </span>
              <span className="text-xs font-semibold text-brand-900">Clauses Modified</span>
            </div>
          </div>

          {/* Key Findings: Resolved vs Newly Introduced */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resolved */}
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-subtle space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>Successfully Resolved / Reduced Risks</span>
              </div>
              {comparison.resolvedRisks?.length > 0 ? (
                <ul className="space-y-2">
                  {comparison.resolvedRisks.map((item, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-emerald-50 text-xs text-emerald-900">
                      <strong>{item.category}:</strong> {item.reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No previously identified risks were reduced in this draft.</p>
              )}
            </div>

            {/* Newly Introduced */}
            <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-subtle space-y-3">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                <ShieldAlert size={18} className="text-red-600" />
                <span>Newly Introduced or Escalated Risks</span>
              </div>
              {comparison.newRisks?.length > 0 ? (
                <ul className="space-y-2">
                  {comparison.newRisks.map((item, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-red-50 text-xs text-red-900">
                      <strong>{item.category}:</strong> {item.reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No new high or medium contractual risks were added in this draft.</p>
              )}
            </div>
          </div>

          {/* Side-by-Side Clause Comparisons */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Clause-by-Clause Side-by-Side Comparison
            </h2>

            <div className="space-y-4">
              {comparison.comparisons?.map((item, idx) => {
                const orig = item.originalClause;
                const rev = item.revisedClause;

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden"
                  >
                    {/* Status header banner */}
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-2 font-semibold">
                        {item.status === 'added' && (
                          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                            + Added Clause
                          </span>
                        )}
                        {item.status === 'removed' && (
                          <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold">
                            - Removed Clause
                          </span>
                        )}
                        {item.status === 'modified' && (
                          <span className="text-brand-700 bg-brand-100 px-2 py-0.5 rounded font-bold">
                            ~ Modified ({item.similarity}% match)
                          </span>
                        )}
                        {item.status === 'unchanged' && (
                          <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded font-bold">
                            = Unchanged ({item.similarity}% match)
                          </span>
                        )}
                        <span>{orig?.category || rev?.category || 'General'}</span>
                      </div>

                      {item.riskChange === 'improved' && (
                        <span className="text-emerald-700 font-semibold">Risk Improved</span>
                      )}
                      {item.riskChange === 'worsened' && (
                        <span className="text-red-700 font-semibold">Risk Escalated</span>
                      )}
                    </div>

                    {/* Side-by-Side Columns on Desktop, Stacked on Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-4 gap-4 text-xs">
                      {/* Left Column: Original */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                          <span>Original Draft A</span>
                          {orig && <RiskBadge risk={orig.risk} size="sm" />}
                        </div>
                        {orig ? (
                          <p className="text-slate-800 leading-relaxed font-mono bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                            {orig.text}
                          </p>
                        ) : (
                          <p className="text-slate-400 italic p-3">[Clause did not exist in Original]</p>
                        )}
                      </div>

                      {/* Right Column: Revised */}
                      <div className="space-y-2 pt-4 md:pt-0">
                        <div className="flex items-center justify-between font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                          <span>Revised Draft B</span>
                          {rev && <RiskBadge risk={rev.risk} size="sm" />}
                        </div>
                        {rev ? (
                          <p className="text-slate-800 leading-relaxed font-mono bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                            {rev.text}
                          </p>
                        ) : (
                          <p className="text-slate-400 italic p-3">[Clause was removed in Revised draft]</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;
