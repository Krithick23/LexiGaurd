import React from 'react';
import { User, Briefcase, Building2, Store } from 'lucide-react';

export const RoleSelector = ({
  value = 'freelancer',
  onChange,
  label = 'Select your contract perspective',
}) => {
  const roles = [
    {
      id: 'freelancer',
      title: 'Freelancer / Contractor',
      desc: 'Focus on payment security, scope creep, revisions, IP ownership, and non-competes.',
      icon: Briefcase,
    },
    {
      id: 'employee',
      title: 'Intern / Employee',
      desc: 'Focus on stipends, training bonds, 90-day notice periods, and off-hours IP grabs.',
      icon: User,
    },
    {
      id: 'small_business',
      title: 'Small Business Owner',
      desc: 'Focus on vendor delivery SLAs, auto-renewals, price escalation, and liability caps.',
      icon: Store,
    },
    {
      id: 'founder',
      title: 'Founder / Startup Owner',
      desc: 'Focus on equity vesting cliffs, Bad Leaver forfeiture, dilution, and investor vetoes.',
      icon: Building2,
    },
  ];

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roles.map((r) => {
          const Icon = r.icon;
          const isSelected = value === r.id;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange && onChange(r.id)}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all text-sm ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20 text-slate-900 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span className={`font-semibold ${isSelected ? 'text-brand-900' : 'text-slate-800'}`}>
                  {r.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelector;
