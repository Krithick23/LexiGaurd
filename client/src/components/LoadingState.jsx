import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Analyzing contract clauses and risk exposures...', subMessage = 'Evaluating against Indian contract benchmarks' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-subtle">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 relative">
        <Loader2 size={28} className="animate-spin text-brand-600" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">{message}</h4>
      {subMessage && <p className="text-xs text-slate-500 max-w-sm">{subMessage}</p>}
    </div>
  );
};

export default LoadingState;
