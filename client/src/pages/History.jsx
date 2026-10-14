import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import contractApi from '../api/contractApi.js';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileQuestion,
  Layers,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export const History = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & filter state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  // Delete dialog state
  const [contractToDelete, setContractToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contractApi.getContracts({
        page,
        limit: 8,
        search,
        risk: riskFilter,
      });

      if (data.success) {
        setContracts(data.contracts);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (err) {
      setError(err.message || 'Failed to load contract history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [page, riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchContracts();
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;
    setIsDeleting(true);
    try {
      await contractApi.deleteContract(contractToDelete._id);
      setContractToDelete(null);
      fetchContracts();
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Contract History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, search, and manage all your past contract risk reviews ({total} total).
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all self-start sm:self-auto"
        >
          <UploadCloud size={16} />
          <span>Analyze Contract</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or contract label..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
          />
        </form>

        {/* Risk Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: '', label: 'All Risks' },
            { id: 'Critical', label: 'Critical' },
            { id: 'High', label: 'High Risk' },
            { id: 'Medium', label: 'Medium' },
            { id: 'Low', label: 'Low Risk' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setRiskFilter(item.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                riskFilter === item.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingState message="Loading your contract history..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchContracts} />
      ) : contracts.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/analysis/${c._id}`}
                          className="font-bold text-sm text-slate-900 hover:text-brand-600 truncate block transition-colors"
                        >
                          {c.fileName}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {c.detectedContractType && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                              {c.detectedContractType}
                            </span>
                          )}
                          {c.label && (
                            <span className="text-[10px] bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full inline-block">
                              {c.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <RiskBadge risk={c.overallRisk} size="sm" />
                      {c.overallRiskScore !== undefined && (
                        <span className="text-[10px] font-bold text-slate-500">
                          {c.overallRiskScore}/100
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="bg-red-50/60 p-2 rounded-lg border border-red-100">
                      <span className="block text-red-600 font-bold">{c.highRiskCount}</span>
                      <span className="text-[10px] text-red-800">High Risk</span>
                    </div>
                    <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                      <span className="block text-amber-600 font-bold">{c.mediumRiskCount}</span>
                      <span className="text-[10px] text-amber-800">Medium</span>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      <span className="block text-emerald-600 font-bold">{c.lowRiskCount}</span>
                      <span className="text-[10px] text-emerald-800">Low Risk</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    <span>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setContractToDelete(c)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete contract analysis"
                    >
                      <Trash2 size={16} />
                    </button>

                    <Link
                      to={`/analysis/${c._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 p-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      <span>View Analysis</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={FileQuestion}
          title="No contracts found"
          description={
            search || riskFilter
              ? 'No contract records match your current filter criteria.'
              : 'You have not uploaded any contracts yet.'
          }
          actionLabel="Analyze Contract"
          actionLink="/upload"
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!contractToDelete}
        title="Delete Contract Analysis"
        message={`Are you sure you want to permanently delete "${contractToDelete?.fileName}"? All extracted clauses and negotiation advice will be removed.`}
        confirmLabel="Delete Contract"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setContractToDelete(null)}
      />
    </div>
  );
};

export default History;
