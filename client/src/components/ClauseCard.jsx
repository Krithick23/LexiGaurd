import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  FileQuestion,
  Scale,
  DollarSign,
  Briefcase,
  AlertOctagon,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import RiskBadge from './RiskBadge.jsx';

export const ClauseCard = ({ clause, index, isExpandedDefault = false, userRole = 'freelancer' }) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const [copiedType, setCopiedType] = useState(null);

  const copyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const riskBorderColor = {
    Critical: 'border-l-4 border-l-red-700 border-slate-200',
    High: 'border-l-4 border-l-red-500 border-slate-200',
    Medium: 'border-l-4 border-l-amber-500 border-slate-200',
    Low: 'border-l-4 border-l-emerald-500 border-slate-200',
    Informational: 'border-l-4 border-l-blue-400 border-slate-200',
  }[clause.risk] || 'border-slate-200';

  const riskScoreBadgeColor =
    clause.riskScore >= 75
      ? 'bg-red-100 text-red-800 border-red-200'
      : clause.riskScore >= 50
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : clause.riskScore >= 25
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';

  const roleLabels = {
    freelancer: 'Freelancer',
    intern: 'Intern',
    employee: 'Intern',
    small_business: 'Small Business Owner',
    founder: 'Small Business Owner',
  };

  const readableRole = roleLabels[userRole] || userRole || 'your role';

  const hasFlags =
    clause.flags &&
    (clause.flags.isMissing ||
      clause.flags.isAmbiguous ||
      clause.flags.isUnusual ||
      clause.flags.isOneSided);

  const hasImpacts =
    clause.impact &&
    (clause.impact.financial || clause.impact.legal || clause.impact.operational);

  const draftWording = clause.negotiation?.alternativeWording || clause.saferAlternative;
  const negotiationSuggest = clause.negotiation?.negotiate || clause.suggestion;

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
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Clause {clause.originalOrder || index + 1}
            </span>
            {clause.title && (
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {clause.title}
              </span>
            )}
            <RiskBadge risk={clause.risk} size="sm" />
            {clause.riskScore !== undefined && clause.riskScore !== null && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${riskScoreBadgeColor}`}
              >
                Risk: {clause.riskScore}/100
              </span>
            )}
            {clause.category && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                {clause.category}
              </span>
            )}
            {clause.negotiation?.recommendLegalReview && (
              <span className="text-[11px] bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                Legal Review Recommended
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-relaxed">
            {clause.text}
          </p>

          {/* Flags preview row */}
          {hasFlags && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {clause.flags.isMissing && (
                <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-semibold">
                  Missing Provision
                </span>
              )}
              {clause.flags.isOneSided && (
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                  One-Sided
                </span>
              )}
              {clause.flags.isAmbiguous && (
                <span className="text-[10px] bg-yellow-50 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded font-semibold">
                  Ambiguous Terms
                </span>
              )}
              {clause.flags.isUnusual && (
                <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                  Unusual Provision
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={isExpanded ? 'Collapse clause' : 'Expand clause'}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 mt-1"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-100 space-y-4 bg-slate-50/30">
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
                {copiedType === 'original' ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Copy size={12} />
                )}
                <span>{copiedType === 'original' ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <div className="p-3.5 bg-slate-100/70 rounded-lg text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed border border-slate-200">
              {clause.text}
            </div>
          </div>

          {/* 2. Plain-English Risk Explanation */}
          {(clause.reason || clause.explanation) && (
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                {clause.risk === 'Critical' ? (
                  <AlertOctagon size={15} className="text-red-700" />
                ) : clause.risk === 'High' ? (
                  <ShieldAlert size={15} className="text-red-500" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-500" />
                )}
                <span>Plain-Language Risk Assessment</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {clause.reason || clause.explanation}
              </p>
              {clause.riskFactors && clause.riskFactors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
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

          {/* 3. Role-Specific Impact: Why this matters */}
          {clause.whyItMatters && (
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                <Briefcase size={14} className="text-indigo-600" />
                <span>Why this matters for a {readableRole}</span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed">
                {clause.whyItMatters}
              </p>
            </div>
          )}

          {/* 4. Multi-Faceted Impact Breakdown: Financial, Legal, Operational */}
          {hasImpacts && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {clause.impact.financial && (
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    <DollarSign size={13} className="text-emerald-600" />
                    <span>Financial Impact</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    {clause.impact.financial}
                  </p>
                </div>
              )}
              {clause.impact.legal && (
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-purple-800">
                    <Scale size={13} className="text-purple-600" />
                    <span>Legal Exposure</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    {clause.impact.legal}
                  </p>
                </div>
              )}
              {clause.impact.operational && (
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-800">
                    <Briefcase size={13} className="text-blue-600" />
                    <span>Operational Risk</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    {clause.impact.operational}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. Suggested Action */}
          {clause.suggestedAction && (
            <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-3 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-brand-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Recommended Action</span>
                <span className="text-xs text-slate-600">{clause.suggestedAction}</span>
              </div>
            </div>
          )}

          {/* 6. Negotiation Suggestions */}
          {(negotiationSuggest || clause.negotiation?.clarify || clause.negotiation?.why) && (
            <div className="bg-brand-50/50 border border-brand-100 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-900">
                  <MessageSquare size={14} className="text-brand-600" />
                  <span>Practical Negotiation Counter-Strategy</span>
                  {clause.negotiation?.priority && (
                    <span className="text-[10px] uppercase font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full ml-1">
                      {clause.negotiation.priority} Priority
                    </span>
                  )}
                </div>
                {negotiationSuggest && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(negotiationSuggest, 'suggestion')}
                    className="inline-flex items-center gap-1 text-xs text-brand-700 hover:text-brand-900 transition-colors"
                  >
                    {copiedType === 'suggestion' ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>{copiedType === 'suggestion' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {clause.negotiation?.clarify && (
                <div className="text-xs text-brand-950">
                  <strong className="text-brand-900">What to clarify:</strong> {clause.negotiation.clarify}
                </div>
              )}

              {negotiationSuggest && (
                <div className="text-xs text-brand-950">
                  <strong className="text-brand-900">What to negotiate:</strong> {negotiationSuggest}
                </div>
              )}

              {clause.negotiation?.why && (
                <div className="text-xs text-brand-950">
                  <strong className="text-brand-900">Why this matters:</strong> {clause.negotiation.why}
                </div>
              )}
            </div>
          )}

          {/* 7. Suggested Draft Alternative Wording */}
          {draftWording && (
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>Suggested Draft Alternative Wording</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(draftWording, 'alternative')}
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                  {copiedType === 'alternative' ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedType === 'alternative' ? 'Copied' : 'Copy Clause'}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 italic bg-white/85 p-3 rounded-lg border border-emerald-200/60 leading-relaxed font-serif">
                "{draftWording}"
              </p>
              <p className="text-[10px] text-emerald-800/80 italic">
                * Note: Alternative wording is presented as a suggested draft for negotiation, not a guarantee of legal enforceability.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClauseCard;
