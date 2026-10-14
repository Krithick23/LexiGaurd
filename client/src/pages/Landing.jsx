import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ArrowRight,
  FileSearch,
  MessageSquare,
  Lock,
  Scale,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Layers,
} from 'lucide-react';
import LegalDisclaimer from '../components/LegalDisclaimer.jsx';
import RiskBadge from '../components/RiskBadge.jsx';

export const Landing = () => {
  const commonRisks = [
    {
      title: '3-Year Post-Termination Non-Competes',
      category: 'Non-Compete',
      risk: 'High',
      desc: 'Clauses barring you from working with any client or competitor in your field. Under Section 27 of the Indian Contract Act, 1872, restraint of trade is generally void, yet often weaponized to intimidate professionals.',
    },
    {
      title: 'Pre-Payment IP & Moral Rights Grabs',
      category: 'Intellectual Property',
      risk: 'High',
      desc: 'Clauses transferring ownership of your code, designs, pre-existing libraries, or personal side projects before invoices are settled, plus irrevocable waivers of moral rights under the Indian Copyright Act, 1957.',
    },
    {
      title: 'Net-90 Days & Unilateral Withholding',
      category: 'Payment Terms',
      risk: 'High',
      desc: 'Delayed payment schedules (60–90+ days) and clauses allowing the client to withhold, discount, or forfeit your fees based on subjective dissatisfaction.',
    },
    {
      title: 'Unlimited Liability & One-Sided Indemnity',
      category: 'Indemnity',
      risk: 'High',
      desc: 'Making individual freelancers or small founders solely liable for third-party damages without a monetary cap, while capping client liability to nominal sums.',
    },
    {
      title: 'Foreign Governing Law & Venue Traps',
      category: 'Dispute Resolution',
      risk: 'Medium',
      desc: 'Specifying Delaware or UK jurisdiction for an Indian freelancer, making dispute resolution economically impossible for individual contractors.',
    },
    {
      title: 'Uncompensated Scope Creep',
      category: 'Scope of Work',
      risk: 'Medium',
      desc: 'Permitting clients to alter or expand project deliverables and deadlines unilaterally without proportional compensation adjustments.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Upload Your Contract',
      desc: 'Drop in your PDF, Word document (.docx), or plain text agreement. We parse text in memory with zero binary file persistence.',
      icon: FileSearch,
    },
    {
      num: '02',
      title: 'Automated Clause Segmentation',
      desc: 'LexiGuard intelligently divides the contract into distinct clauses, preserving the exact source text and paragraph context.',
      icon: Layers,
    },
    {
      num: '03',
      title: 'Role-Tailored Risk Scoring',
      desc: 'Our AI pipeline benchmarks terms for Indian freelancers, employees, or founders—flagging high, medium, and low risk clauses.',
      icon: Cpu,
    },
    {
      num: '04',
      title: 'Negotiation Counters & PDF Export',
      desc: 'Get concise, diplomatic counter-proposals and balanced safer clauses ready to email your client, plus a downloadable PDF summary.',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-12 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold shadow-subtle">
            <Sparkles size={14} className="text-brand-600" />
            <span>AI Contract Risk Analyzer for Indian Freelancers & Founders</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Understand your contract <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-brand-600 to-indigo-800 bg-clip-text text-transparent">
              before you sign.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Spot predatory non-competes, IP grabs, 90-day payment delays, and unlimited liability traps. Receive plain-English risk explanations and diplomatic counter-proposals in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-highlight transition-all text-sm"
            >
              <span>Analyze Your Contract Free</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors text-sm shadow-subtle"
            >
              Sign In to Workspace
            </Link>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            No credit card required • In-memory parsing • Educational first-pass review
          </p>
        </div>
      </section>

      {/* Interactive Risk Preview Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Analysis Example: Predatory Clause</h3>
                <p className="text-xs text-slate-500">Real-world clause extracted from actual freelance master services agreement</p>
              </div>
            </div>
            <RiskBadge risk="High" size="sm" />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 font-mono leading-relaxed">
            "Contractor unconditionally assigns all inventions and pre-existing side projects immediately upon creation, irrespective of whether Company has paid Contractor for the services."
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-1">
              <span className="font-bold text-red-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-red-600" />
                Why This Is Risky
              </span>
              <p className="text-red-950 leading-relaxed">
                Demands your intellectual property before you are paid and captures your pre-existing side projects. If the client refuses to pay, you will have already lost rights to your work.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-600" />
                Suggested Negotiation Counter
              </span>
              <p className="text-emerald-950 leading-relaxed">
                "Upon full and final payment of all corresponding fees, Contractor transfers ownership in bespoke project deliverables. Contractor retains ownership of pre-existing background code."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How LexiGuard Works
          </h2>
          <p className="text-sm text-slate-500">
            A 4-step automated pipeline designed to give you clarity and negotiation leverage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle hover:border-brand-300 transition-all space-y-3 relative group"
              >
                <div className="text-xs font-mono font-bold text-brand-600 tracking-wider">
                  {step.num}
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Contractual Risks We Spot */}
      <section id="risks" className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Common Contractual Traps We Identify
          </h2>
          <p className="text-sm text-slate-500">
            Clauses that seem routine until a payment dispute or project termination happens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commonRisks.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle hover:shadow-card transition-shadow space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <RiskBadge risk={item.risk} size="sm" />
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section id="security" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white space-y-6 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
            <Lock size={14} className="text-emerald-400" />
            <span>Zero Binary Persistence & Security Engineering</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Your contracts belong to you. <br />
            We never store original binary files.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 text-xs sm:text-sm text-slate-300">
            <div className="space-y-2">
              <h4 className="font-bold text-white text-base">In-Memory Text Extraction</h4>
              <p className="text-slate-400 leading-relaxed">
                Uploaded PDFs and Word documents are parsed in temporary memory and never stored as raw file buffers on disk or in the database.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white text-base">Prompt Injection Defense</h4>
              <p className="text-slate-400 leading-relaxed">
                Untrusted contract text is strictly treated as passive payload. Embedded malicious system overrides or role breakout instructions are blocked.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white text-base">User Data Control</h4>
              <p className="text-slate-400 leading-relaxed">
                Delete any contract analysis or delete your entire account with a single click. All associated records are permanently purged.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Legal Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <LegalDisclaimer />
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-brand-50 border border-brand-200 rounded-3xl p-8 sm:p-12 space-y-4 shadow-subtle">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Ready to review your agreement?
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Join Indian freelancers and founders reviewing their contracts before signing. Upload a file or try our interactive demo.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition-all text-sm"
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
