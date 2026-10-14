import React from 'react';
import { Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                LexiGuard
              </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              Understand your contract before you sign. AI-powered contract risk review and negotiation suggestions designed specifically for Indian freelancers, employees, and founders.
            </p>
            <p className="text-[11px] text-slate-500">
              Compliant with Section 27 Indian Contract Act benchmarks & Indian Copyright Act standards.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2.5">
            <h5 className="text-white font-semibold text-sm">Product</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/upload" className="hover:text-white transition-colors">
                  Analyze Agreement
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition-colors">
                  Compare Contract Versions
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Risk Dashboard
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-white transition-colors">
                  Analysis History
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Resources */}
          <div className="space-y-2.5">
            <h5 className="text-white font-semibold text-sm">Safety & Trust</h5>
            <ul className="space-y-2">
              <li>
                <a href="#security" className="hover:text-white transition-colors">
                  Privacy Policy & Zero-Binary Storage
                </a>
              </li>
              <li>
                <a href="#risks" className="hover:text-white transition-colors">
                  Common Contract Red Flags
                </a>
              </li>
              <li>
                <span className="text-slate-500">
                  Not a Substitute for Legal Counsel
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-8 border-t border-slate-800 text-[11px] text-slate-500 space-y-2">
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> LexiGuard is an automated contract intelligence tool for educational and negotiation preparation purposes only. It is not an advocate or law firm, does not provide formal legal counsel or opinions, and cannot guarantee judicial enforceability of any contractual clause. If you have significant legal or financial exposure, consult a qualified advocate licensed in your jurisdiction.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-slate-600">
            <span>© {new Date().getFullYear()} LexiGuard. All rights reserved.</span>
            <span>Crafted for Indian independent professionals & small businesses.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
