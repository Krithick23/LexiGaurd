import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const RedFlagSummary = ({ redFlags = [], overallRisk = 'Low' }) => {
  if (!redFlags || redFlags.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-emerald-900">No Critical Red Flags Identified</h4>
          <p className="text-xs text-emerald-700 mt-0.5">
            This agreement does not trigger obvious predatory traps or unilateral liability penalties based on standard review benchmarks.
          </p>
        </div>
      </div>
    );
  }

  const isCritical = overallRisk === 'Critical';
  const isHigh = overallRisk === 'High' || isCritical;

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 shadow-subtle ${
        isCritical
          ? 'bg-red-50/90 border-red-300 ring-1 ring-red-500/20'
          : isHigh
          ? 'bg-red-50/70 border-red-200'
          : 'bg-amber-50/70 border-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {isHigh ? (
          <AlertOctagon size={22} className={isCritical ? 'text-red-700' : 'text-red-600'} />
        ) : (
          <AlertTriangle size={22} className="text-amber-600" />
        )}
        <h3
          className={`font-bold text-base ${
            isCritical ? 'text-red-950' : isHigh ? 'text-red-950' : 'text-amber-950'
          }`}
        >
          {isCritical ? 'Critical Legal & Financial Traps' : 'Critical Attention Needed'} ({redFlags.length}{' '}
          Red Flag{redFlags.length > 1 ? 's' : ''})
        </h3>
      </div>
      <p className={`text-xs mb-3.5 ${isHigh ? 'text-red-800' : 'text-amber-800'}`}>
        Review these high-exposure contractual terms carefully and prioritize them in your counter-proposal:
      </p>
      <ul className="space-y-2.5">
        {redFlags.map((flag, index) => (
          <li
            key={index}
            className={`flex items-start gap-2.5 text-xs sm:text-sm bg-white/90 backdrop-blur-sm p-3.5 rounded-xl border shadow-subtle ${
              isCritical ? 'border-red-200 text-red-950' : 'border-red-100 text-slate-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                isCritical ? 'bg-red-600 ring-2 ring-red-300' : 'bg-red-500'
              }`}
            ></span>
            <span className="font-medium leading-relaxed">{flag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RedFlagSummary;
