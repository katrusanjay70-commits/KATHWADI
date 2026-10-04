import React from 'react';
import {
  Sprout,
  MapPin,
  ArrowRight,
  Shield,
  Coins,
  Wheat,
  CheckCircle2,
  Users,
  Layers,
  ChevronRight,
  Award,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LandListing } from '../types';

interface LandingPageProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  featuredLands: LandListing[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenAuth,
  featuredLands,
}) => {
  const { currentUser, userProfile } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#52b788_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-600/50 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-200 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>India's Dedicated Agricultural Land Sharing & Kisan Support Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-serif text-white leading-tight">
              Connect Arable Farmlands With Dedicated <span className="text-emerald-400 underline decoration-emerald-500/40">Farmers</span>
            </h1>

            <p className="text-base sm:text-lg text-emerald-200/90 leading-relaxed font-normal">
              <strong>KETHWADI</strong> unites agricultural landowners seeking trustworthy cultivators with hardworking farmers seeking fertile land, high-yield seeds, institutional credit, and life protection.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {currentUser ? (
                <button
                  onClick={() =>
                    onNavigate(
                      userProfile?.role === 'land_owner'
                        ? 'landowner_dashboard'
                        : userProfile?.role === 'admin'
                        ? 'admin_dashboard'
                        : 'farmer_dashboard'
                    )
                  }
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black px-7 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2 text-base"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="w-full sm:w-auto bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black px-7 py-4 rounded-2xl shadow-xl shadow-emerald-400/20 transition flex items-center justify-center gap-2 text-base"
                  >
                    <span>Register as Farmer or Land Owner</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onNavigate('find_land')}
                    className="w-full sm:w-auto bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold px-7 py-4 rounded-2xl border border-emerald-700/80 backdrop-blur-xs transition flex items-center justify-center gap-2 text-base"
                  >
                    <span>Browse Available Farmlands</span>
                  </button>
                </>
              )}
            </div>

            {/* Quick Stat Badges */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-emerald-900/50 border border-emerald-800/80 p-3.5 rounded-2xl">
                <p className="text-2xl font-black text-emerald-300">100%</p>
                <p className="text-xs text-emerald-300/80 font-medium">Real Verified Listings</p>
              </div>
              <div className="bg-emerald-900/50 border border-emerald-800/80 p-3.5 rounded-2xl">
                <p className="text-2xl font-black text-amber-300">₹0 Fee</p>
                <p className="text-xs text-emerald-300/80 font-medium">Direct Farmer Discovery</p>
              </div>
              <div className="bg-emerald-900/50 border border-emerald-800/80 p-3.5 rounded-2xl">
                <p className="text-2xl font-black text-emerald-300">Govt</p>
                <p className="text-xs text-emerald-300/80 font-medium">PMJJBY & LIC Policies</p>
              </div>
              <div className="bg-emerald-900/50 border border-emerald-800/80 p-3.5 rounded-2xl">
                <p className="text-2xl font-black text-amber-300">Fast</p>
                <p className="text-xs text-emerald-300/80 font-medium">Crop & Seed Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Farmland Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
              <Sprout className="w-4 h-4" /> Live Arable Lands Available
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 font-serif">
              Discover Ready Farmlands
            </h2>
            <p className="text-sm text-emerald-800/80 mt-1">
              Browse land with rich black soil, canal irrigation, borewells, and seasonal lease options.
            </p>
          </div>
          <button
            onClick={() => onNavigate('find_land')}
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950 group self-start sm:self-auto"
          >
            <span>View All Farmlands</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
        </div>

        {featuredLands.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-emerald-100 shadow-sm">
            <Sprout className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">Fresh Farmland Listings Loading</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Land owners are actively uploading their farmlands. Check back or list your farmland now.
            </p>
            <button
              onClick={() => onNavigate('add_land')}
              className="mt-4 inline-flex items-center gap-2 bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition"
            >
              Post Farmland as Land Owner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredLands.slice(0, 3).map((land) => (
              <div
                key={land.id}
                onClick={() => onNavigate('land_details', { landId: land.id })}
                className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition cursor-pointer flex flex-col group"
              >
                <div className="relative aspect-video bg-emerald-900/10 overflow-hidden">
                  <img
                    src={
                      land.photos && land.photos.length > 0
                        ? land.photos[0]
                        : 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={land.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-950/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    {land.sizeAcres} Acres
                  </div>
                  <div className="absolute top-3 right-3 bg-white/95 text-emerald-900 text-xs font-black px-2.5 py-1 rounded-lg shadow-xs">
                    ₹{land.rentAmount.toLocaleString()} / {land.rentPeriod}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{land.location}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-emerald-800 transition">
                      {land.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {land.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                      {land.soilType}
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Two Pillars: How it works for Farmers & Land Owners */}
      <section className="bg-emerald-50/70 border-y border-emerald-100/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 font-serif">
              Built Specifically for the Farming Community
            </h2>
            <p className="text-sm text-emerald-800 mt-2">
              A transparent, two-way bridge connecting landowners with cultivators and financial protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Farmer Card */}
            <div className="bg-white rounded-3xl p-8 border border-emerald-200/80 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Sprout className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-emerald-950 font-serif">For Farmers (Cultivators)</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Gain access to fertile farmlands without intermediaries, complete your lease agreements, and access essential agricultural ecosystem services.
                </p>

                <ul className="space-y-2.5 text-xs text-gray-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Browse and filter available arable lands by soil type, acreage & rent</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Join farmlands and manage ongoing cultivation records</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Apply for official PMJJBY & LIC Life Insurance policies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Request high-yield subsidized seeds and Kisan Credit loan guidance</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => {
                    if (currentUser) onNavigate('farmer_dashboard');
                    else onOpenAuth('register');
                  }}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl transition text-xs sm:text-sm"
                >
                  Join as Farmer
                </button>
              </div>
            </div>

            {/* Land Owner Card */}
            <div className="bg-white rounded-3xl p-8 border border-emerald-200/80 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-emerald-950 font-serif">For Land Owners</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Prevent farmland from lying fallow. List your agricultural plots, connect with experienced cultivators, and track who is actively cultivating your land.
                </p>

                <ul className="space-y-2.5 text-xs text-gray-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>List your farmland with photos, soil type, water source & rent price</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Edit, pause availability, or permanently delete lands with 1-click</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>View verified farmers working on your plots & planted crops</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Access institutional life cover & owner safety schemes</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => {
                    if (currentUser) onNavigate('landowner_dashboard');
                    else onOpenAuth('register');
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl transition text-xs sm:text-sm"
                >
                  List Farmland as Land Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem: Life Insurance, Loans & Seeds */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-emerald-600" /> Complete Agricultural Ecosystem
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 font-serif">
            Financial Security & Cultivation Support
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            KETHWADI bridges cultivators with genuine institutional life insurance, subsidized seed assistance, and agricultural credit schemes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-emerald-100 shadow-sm hover:border-emerald-300 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Life Insurance Policies</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Explore official policies like PMJJBY (₹2 Lakh life risk at ₹436/yr) and AIC Kisan Suraksha term cover. Apply online and track status.
            </p>
            <button
              onClick={() => onNavigate('insurance')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              Browse Policies <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-emerald-100 shadow-sm hover:border-emerald-300 transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Agricultural Credit & Loans</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Kisan Credit Card (KCC) assistance, tractor/mechanization financing, and low-interest seasonal crop credit options.
            </p>
            <button
              onClick={() => onNavigate('loans')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              Explore Loan Schemes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-emerald-100 shadow-sm hover:border-emerald-300 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Wheat className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Certified Seed Support</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Access high-germination certified seed varieties for Kharif, Rabi, and Zaid seasons. Submit seed quantity inquiries directly.
            </p>
            <button
              onClick={() => onNavigate('seed_support')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              Request Seeds <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black font-serif">
              Ready to Start Cultivating or List Your Farmland?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
              Join thousands of agricultural families registered on KETHWADI. Free registration with real-time land matching.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black px-6 py-3.5 rounded-xl text-sm transition shadow-md"
              >
                Create Free Account
              </button>
              <button
                onClick={() => onNavigate('find_land')}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl text-sm border border-white/20 transition"
              >
                Search Available Farmland
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
