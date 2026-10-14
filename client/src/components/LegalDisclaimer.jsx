import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';

export const LegalDisclaimer = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-start gap-2 p-3 bg-slate-100/80 rounded-lg text-xs text-slate-500 border border-slate-200">
        <Info size={15} className="shrink-0 text-slate-400 mt-0.5" />
        <p>
          <strong className="font-semibold text-slate-700">Educational Assistant:</strong> LexiGuard provides automated first-pass contract insights and negotiation assistance. It does not provide definitive legal advice and is not a substitute for a qualified advocate.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 space-y-2">
      <div className="flex items-center gap-2 font-semibold text-slate-800">
        <ShieldCheck size={16} className="text-brand-600" />
        <span>Important Legal Disclaimer & AI Notice</span>
      </div>
      <p className="leading-relaxed">
        LexiGuard is an intelligent contract review assistant developed to help freelancers, employees, and small business owners understand complex contract terminology and spot common one-sided risks.
      </p>
      <p className="leading-relaxed">
        LexiGuard outputs are generated using automated analysis and machine learning heuristics. <strong>Outputs do not constitute formal legal advice, attorney-client representation, or guarantees of judicial enforceability under Indian or international law.</strong> Always consult an experienced legal advocate for high-stakes agreements.
      </p>
    </div>
  );
};

export default LegalDisclaimer;
