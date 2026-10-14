import React from 'react';
import { Briefcase, User, Store } from 'lucide-react';

export const RoleSelector = ({
  value = 'freelancer',
  onChange,
  label = 'Select your contract perspective',
}) => {
  const roles = [
    {
      id: 'freelancer',
      title: 'Freelancer',
      icon: Briefcase,
    },
    {
      id: 'intern',
      title: 'Intern',
      icon: User,
    },
    {
      id: 'small_business',
      title: 'Small Business Owner',
      icon: Store,
    },
  ];

  // Map old 'employee' to 'intern' or keep selection aligned
  const activeValue = value === 'employee' ? 'intern' : value === 'founder' ? 'small_business' : value;

  return (
    <div className="w-full space-y-2">
      {label && <label className="block text-sm font-bold text-slate-800">{label}</label>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {roles.map((r) => {
          const Icon = r.icon;
          const isSelected = activeValue === r.id;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange && onChange(r.id)}
              className={`group flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-subtle'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                }`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`font-bold text-sm block leading-snug truncate ${
                    isSelected ? 'text-brand-950' : 'text-slate-900'
                  }`}
                >
                  {r.title}
                </span>
                <div
                  className={`h-0.5 rounded-full mt-1.5 transition-all duration-200 ${
                    isSelected ? 'bg-brand-600 w-10' : 'bg-slate-200 w-6 group-hover:w-8 group-hover:bg-slate-300'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelector;
