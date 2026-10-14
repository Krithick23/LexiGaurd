import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import contractApi from '../api/contractApi.js';
import {
  FileText,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  UploadCloud,
  History,
  ArrowRight,
  TrendingUp,
  FileQuestion,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import RiskBadge from '../components/RiskBadge.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contractApi.getUserStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLoadDemo = async (type = 'toxic') => {
    setLoadingDemo(true);
    try {
      await contractApi.loadSampleContract(type);
      await fetchStats();
    } catch (err) {
      alert(`Demo load failed: ${err.message}`);
    } finally {
      setLoadingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <LoadingState message="Loading your contract metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ErrorMessage message={error} onRetry={fetchStats} />
      </div>
    );
  }

  const hasContracts = stats && stats.totalContracts > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Perspective: <strong className="capitalize text-white">{user?.role || 'Freelancer'}</strong></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Monitor your contract risk profile, track high-risk traps, and review newly analyzed agreements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-400 text-white shadow-md transition-all"
          >
            <UploadCloud size={18} />
            <span>Analyze New Contract</span>
          </Link>
        </div>
      </div>

      {hasContracts ? (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Analyzed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Analyzed Contracts
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {stats.totalContracts}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <FileText size={22} />
              </div>
            </div>

            {/* High Risk Clauses */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                  High-Risk Traps
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1">
                  {stats.totalHighRiskClauses}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <ShieldAlert size={22} />
              </div>
            </div>

            {/* Medium Risk Clauses */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  Medium-Risk Items
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                  {stats.totalMediumRiskClauses}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={22} />
              </div>
            </div>

            {/* Low Risk Clauses */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Safe / Low-Risk Clauses
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                  {stats.totalLowRiskClauses}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
            </div>
          </div>

          {/* Charts & Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Contract Risk Breakdown</h3>
                  <p className="text-xs text-slate-500">Distribution across analyzed agreements</p>
                </div>
                <TrendingUp size={18} className="text-brand-600" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.riskDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                    >
                      {stats.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Contracts List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Contract Activity</h3>
                  <p className="text-xs text-slate-500">Recently uploaded agreements and status</p>
                </div>
                <Link
                  to="/history"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {stats.recentContracts?.map((contract) => (
                  <div
                    key={contract._id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/analysis/${contract._id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-brand-600 truncate block transition-colors"
                        >
                          {contract.fileName}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          {contract.label && (
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded font-medium">
                              {contract.label}
                            </span>
                          )}
                          <span>
                            {new Date(contract.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span>{contract.clauseCount} clauses</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <RiskBadge risk={contract.overallRisk} size="sm" />
                      <Link
                        to={`/analysis/${contract._id}`}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="View Analysis"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State for New Users */
        <div className="space-y-6">
          <EmptyState
            icon={FileQuestion}
            title="No contracts analyzed yet"
            description="Welcome to LexiGuard! Upload your first agreement (PDF, DOCX, or TXT) to identify contractual risks and receive negotiation counter-proposals."
            actionLabel="Analyze First Contract"
            actionLink="/upload"
          />

          {/* Quick Demo Contract Action */}
          <div className="max-w-xl mx-auto bg-brand-50/70 border border-brand-200 rounded-2xl p-5 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-brand-900 font-bold text-sm">
              <Sparkles size={16} className="text-brand-600" />
              <span>Want to see LexiGuard in action immediately?</span>
            </div>
            <p className="text-xs text-brand-800">
              Load our pre-built sample freelance agreement with real predatory clauses (3-year non-compete, IP grab, Net-90 payment).
            </p>
            <button
              type="button"
              onClick={() => handleLoadDemo('toxic')}
              disabled={loadingDemo}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <span>{loadingDemo ? 'Analyzing Demo...' : 'Load Toxic Freelance Demo Agreement'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
