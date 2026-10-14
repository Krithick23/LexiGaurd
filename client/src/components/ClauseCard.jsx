import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Sparkles, MessageSquare, ShieldAlert } from 'lucide-react';
import RiskBadge from './RiskBadge.jsx';

export const ClauseCard = ({ clause, index, isExpandedDefault = false }) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const [copiedType, setCopiedType] = useState(null);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const riskBorderColor = {
    High: 'border-l-4 border-l-red-500 border-slate-200',
    Medium: 'border-l-4 border-l-amber-500 border-slate-200',
    Low: 'border-l-4 border-l-emerald-500 border-slate-200',
  }[clause.risk] || 'border-slate-200';

  return (
    <div
      className={`bg-white rounded-xl border shadow-subtle transition-all duration-200 overflow-hidden ${riskBorderColor}`}
    >
      {/* Header bar / Click to Toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Clause {clause.originalOrder || index + 1}
            </span>
            <RiskBadge risk={clause.risk} size="sm" />
            {clause.category && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                {clause.category}
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-relaxed">
            {clause.text}
          </p>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? 'Collapse clause' : 'Expand clause'}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 mt-1"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/30">
          {/* 1. Full Original Text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Original Contract Text
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(clause.text, 'original')}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 transition-colors"
              >
                {copiedType === 'original' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedType === 'original' ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <div className="p-3.5 bg-slate-100/70 rounded-lg text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed border border-slate-200">
              {clause.text}
            </div>
          </div>

          {/* 2. Plain-English Risk Explanation */}
          {clause.reason && (
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <ShieldAlert size={14} className={clause.risk === 'High' ? 'text-red-500' : 'text-amber-500'} />
                <span>Why This Clause Deserves Attention</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {clause.reason}
              </p>
              {clause.riskFactors && clause.riskFactors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {clause.riskFactors.map((rf, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
                    >
                      {rf}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Negotiation Suggestion */}
          {clause.suggestion && (
            <div className="bg-brand-50/50 border border-brand-100 rounded-lg p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-900">
                  <MessageSquare size={14} className="text-brand-600" />
                  <span>Practical Negotiation Counter-Proposal</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(clause.suggestion, 'suggestion')}
                  className="inline-flex items-center gap-1 text-xs text-brand-700 hover:text-brand-900 transition-colors"
                >
                  {copiedType === 'suggestion' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedType === 'suggestion' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-brand-950 leading-relaxed">
                {clause.suggestion}
              </p>
            </div>
          )}

          {/* 4. Safer Alternative Clause */}
          {clause.saferAlternative && (
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>Safer Balanced Alternative Language</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(clause.saferAlternative, 'alternative')}
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                  {copiedType === 'alternative' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedType === 'alternative' ? 'Copied' : 'Copy Clause'}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 italic bg-white/80 p-2.5 rounded border border-emerald-200/50 leading-relaxed">
                "{clause.saferAlternative}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClauseCard;
