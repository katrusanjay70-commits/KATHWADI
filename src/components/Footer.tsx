import React from 'react';
import { Sprout, Phone, ShieldCheck, HeartHandshake, FileText, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900/80 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-emerald-900">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5 text-emerald-200" />
              </div>
              <span className="text-xl font-black tracking-tight text-white font-serif">KETHWADI</span>
            </div>
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              Empowering farmers with available arable land and empowering land owners with trustworthy cultivators, high-yield seed assistance, institutional credit access, and term life protection.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>National Kisan Call Center: <strong>1800-180-1551</strong></span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Farmland Discovery</h4>
            <ul className="space-y-2 text-xs text-emerald-300">
              <li>
                <button
                  onClick={() => onNavigate?.('find_land')}
                  className="hover:text-white transition"
                >
                  Browse Arable Farmlands
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('add_land')}
                  className="hover:text-white transition"
                >
                  List Farmland (Land Owners)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('farming_work')}
                  className="hover:text-white transition"
                >
                  Cultivation Partnerships
                </button>
              </li>
              <li>
                <span className="text-emerald-400 font-medium">Black & Alluvial Soil Listings</span>
              </li>
            </ul>
          </div>

          {/* Financial & Support Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Support Ecosystem</h4>
            <ul className="space-y-2 text-xs text-emerald-300">
              <li>
                <button
                  onClick={() => onNavigate?.('insurance')}
                  className="hover:text-white transition"
                >
                  Life Insurance Policies (LIC / PMJJBY)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('loans')}
                  className="hover:text-white transition"
                >
                  Kisan Credit Card & Farm Loans
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('seed_support')}
                  className="hover:text-white transition"
                >
                  High-Yield Seed Distribution
                </button>
              </li>
              <li>
                <span className="text-emerald-400/90">Soil Health & Moisture Testing Guides</span>
              </li>
            </ul>
          </div>

          {/* Legal / Regulatory Notice */}
          <div className="space-y-3 bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Regulatory Disclosure</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              <strong>KETHWADI</strong> acts strictly as an agricultural technological facilitation platform connecting registered landowners and farmers. KETHWADI does not underwrite or issue insurance policies or disburse loans directly; all financial policies and schemes are facilitated through authorized insurers (e.g., LIC of India, AIC) and licensed financial institutions.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400 gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} KETHWADI Agro Technologies. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-emerald-300">
            <span>Verified Farmland Registry</span>
            <span>•</span>
            <span>Transparent Leasing</span>
            <span>•</span>
            <button
              onClick={() => onNavigate?.('admin_login')}
              className="text-amber-400 hover:text-amber-300 font-bold underline py-1"
            >
              Staff & Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
