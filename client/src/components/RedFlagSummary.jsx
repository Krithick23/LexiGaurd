import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const RedFlagSummary = ({ redFlags = [], overallRisk = 'Low' }) => {
  if (!redFlags || redFlags.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
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

  const isHigh = overallRisk === 'High';

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isHigh ? 'bg-red-50/70 border-red-200' : 'bg-amber-50/70 border-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {isHigh ? (
          <AlertOctagon size={20} className="text-red-600" />
        ) : (
          <AlertTriangle size={20} className="text-amber-600" />
        )}
        <h3
          className={`font-bold text-base ${isHigh ? 'text-red-950' : 'text-amber-950'}`}
        >
          Critical Attention Needed ({redFlags.length} Red Flag{redFlags.length > 1 ? 's' : ''})
        </h3>
      </div>
      <p className={`text-xs mb-3 ${isHigh ? 'text-red-800' : 'text-amber-800'}`}>
        Review these high-exposure contractual terms carefully and prioritize them in your counter-proposal:
      </p>
      <ul className="space-y-2">
        {redFlags.map((flag, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-red-100 shadow-subtle"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
            <span className="text-slate-800 font-medium leading-relaxed">{flag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RedFlagSummary;
