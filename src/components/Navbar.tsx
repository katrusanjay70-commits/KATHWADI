import React, { useState, useEffect } from 'react';
import {
  Sprout,
  User as UserIcon,
  LogOut,
  MapPin,
  Shield,
  Coins,
  Wheat,
  PlusCircle,
  Briefcase,
  Layers,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserRole } from '../types';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onOpenAuth }) => {
  const { currentUser, userProfile, logout, updateUserProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      setMobileMenuOpen(false);
      setRoleDropdownOpen(false);
      setIsLoggingOut(false);
      onNavigate('landing');
    }
  };

  // Close mobile drawer on Escape key and prevent background scroll while open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleRoleSwitch = async (newRole: UserRole) => {
    if (!userProfile) return;
    await updateUserProfile({ role: newRole });
    setRoleDropdownOpen(false);
    if (newRole === 'farmer') onNavigate('farmer_dashboard');
    else if (newRole === 'land_owner') onNavigate('landowner_dashboard');
    else if (newRole === 'admin') onNavigate('admin_dashboard');
  };

  const isFarmer = userProfile?.role === 'farmer';
  const isLandOwner = userProfile?.role === 'land_owner';
  const isAdmin = userProfile?.role === 'admin' || currentUser?.email === 'katrusanjay70@gmail.com';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center text-white shadow-md shadow-emerald-900/15 group-hover:scale-105 transition">
              <Sprout className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 font-serif">
                  KETHWADI
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  AgriHub
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-700 font-medium hidden sm:block">
                Connecting Farmers & Farmlands
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
            {currentUser && isFarmer && (
              <>
                <button
                  onClick={() => onNavigate('farmer_dashboard')}
                  className={`px-3 py-2 rounded-xl transition ${
                    currentPage === 'farmer_dashboard' || currentPage === 'find_land'
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Find Farmland
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('farming_work')}
                  className={`px-3 py-2 rounded-xl transition ${
                    currentPage === 'farming_work'
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-600" /> My Farming Work
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('insurance')}
                  className={`px-3 py-2 rounded-xl transition ${
                    currentPage === 'insurance'
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" /> Life Insurance
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('loans')}
                  className={`px-3 py-2 rounded-xl transition ${
                    currentPage === 'loans'
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-600" /> Agri Loans
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('seed_support')}
                  className={`px-3 py-2 rounded-xl transition ${
                    currentPage === 'seed_support'
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Wheat className="w-4 h-4 text-emerald-600" /> Seed Support
                  </span>
                </button>
              </>
            )}

            {currentUser && isLandOwner && (
              <>
                <button
                  onClick={() => onNavigate('landowner_dashboard')}
                  className={`px-3 py-2 rounded-xl transition ${
                    currentPage === 'landowner_dashboard' || currentPage === 'my_lands'
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" /> My Farmlands
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('add_land')}
                  className={`px-3 py-2 rounded-xl transition ${
                    currentPage === 'add_land'
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-emerald-900">
                    <PlusCircle className="w-4 h-4 text-emerald-700" /> Add New Land
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('landowner_farmers')}
                  className={`px-3 py-2 rounded-xl transition ${
                    currentPage === 'landowner_farmers'
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-600" /> Working Farmers
                  </span>
                </button>
                <button
                  onClick={() => onNavigate('insurance')}
                  className={`px-3 py-2 rounded-xl transition ${
                    currentPage === 'insurance'
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" /> Life Insurance
                  </span>
                </button>
              </>
            )}

            {currentUser && isAdmin && (
              <button
                onClick={() => onNavigate('admin_dashboard')}
                className={`px-3 py-2 rounded-xl transition ${
                  currentPage === 'admin_dashboard'
                    ? 'bg-amber-100 text-amber-950 font-bold'
                    : 'text-amber-900 hover:bg-amber-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-amber-600" /> Admin Console
                </span>
              </button>
            )}

            {!currentUser && (
              <>
                <button
                  onClick={() => onNavigate('find_land')}
                  className="px-3 py-2 rounded-xl text-emerald-800 hover:bg-emerald-50 transition"
                >
                  Explore Farmlands
                </button>
                <button
                  onClick={() => onNavigate('insurance')}
                  className="px-3 py-2 rounded-xl text-emerald-800 hover:bg-emerald-50 transition"
                >
                  Life Insurance Policies
                </button>
                <button
                  onClick={() => onNavigate('loans')}
                  className="px-3 py-2 rounded-xl text-emerald-800 hover:bg-emerald-50 transition"
                >
                  Agri Loans
                </button>
                <button
                  onClick={() => onNavigate('admin_login')}
                  className="px-2.5 py-1.5 rounded-xl text-amber-800 hover:bg-amber-50 border border-amber-200/80 font-bold transition flex items-center gap-1 text-xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" /> Admin Portal
                </button>
              </>
            )}
          </nav>

          {/* Right Section: User / Auth Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {currentUser && (
              <>
                {/* Real-time notifications */}
                <NotificationsDropdown onNavigate={onNavigate} />

                {/* Role Switcher Pill (Desktop only to prevent mobile overflow) */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition"
                    title="Switch active viewing role"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="capitalize">{userProfile?.role?.replace('_', ' ') || 'User'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                  </button>

                  {roleDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setRoleDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-emerald-100 py-1.5 z-40 text-xs">
                        <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400">
                          Switch Platform Role
                        </div>
                        <button
                          onClick={() => handleRoleSwitch('farmer')}
                          className={`w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between ${
                            userProfile?.role === 'farmer' ? 'font-bold text-emerald-800' : 'text-gray-700'
                          }`}
                        >
                          <span>Farmer View</span>
                          {userProfile?.role === 'farmer' && <span className="text-emerald-600">✓</span>}
                        </button>
                        <button
                          onClick={() => handleRoleSwitch('land_owner')}
                          className={`w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between ${
                            userProfile?.role === 'land_owner' ? 'font-bold text-emerald-800' : 'text-gray-700'
                          }`}
                        >
                          <span>Land Owner View</span>
                          {userProfile?.role === 'land_owner' && <span className="text-emerald-600">✓</span>}
                        </button>
                        {(isAdmin || currentUser?.email === 'katrusanjay70@gmail.com') && (
                          <button
                            onClick={() => handleRoleSwitch('admin')}
                            className={`w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center justify-between text-amber-900 ${
                              userProfile?.role === 'admin' ? 'font-bold' : ''
                            }`}
                          >
                            <span>Admin View</span>
                            {userProfile?.role === 'admin' && <span className="text-amber-600">✓</span>}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Profile Avatar & Menu */}
                <button
                  onClick={() => onNavigate('profile')}
                  className={`p-1.5 rounded-xl border flex items-center gap-2 transition ${
                    currentPage === 'profile'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-emerald-200 hover:border-emerald-400 bg-white'
                  }`}
                  title="My Profile"
                >
                  {userProfile?.photoUrl ? (
                    <img
                      src={userProfile.photoUrl}
                      alt={userProfile.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                      {userProfile?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-emerald-950 max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline">
                    {userProfile?.name}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:text-red-700 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition cursor-pointer"
                  title="Logout from account"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span className="hidden sm:inline">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </>
            )}

            {!currentUser && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-xs sm:text-sm font-bold text-emerald-900 hover:text-emerald-700 px-2.5 sm:px-3 py-2 rounded-xl hover:bg-emerald-50 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-3 sm:px-4 py-2 rounded-xl shadow-xs transition"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile menu trigger with touch-friendly hit area */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-emerald-900 hover:bg-emerald-100 transition active:scale-95"
              aria-label="Open Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer - Slide-in from right covering 85% width */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          visibility: mobileMenuOpen ? 'visible' : 'hidden',
          transition: 'visibility 300ms ease',
        }}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop: Clicking closes the mobile navigation menu */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer drawer-backdrop ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Close navigation menu backdrop"
        />

        {/* Slide-over Drawer Panel: Strictly covers 85% of screen width from the right side */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 drawer-panel-right bg-white shadow-2xl flex flex-col h-full border-l border-emerald-100 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-emerald-100 bg-emerald-50/70 shrink-0">
            <div
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('landing');
              }}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center text-white shadow-xs">
                <Sprout className="w-4.5 h-4.5 text-emerald-200" />
              </div>
              <div>
                <span className="font-serif font-black text-base text-emerald-950 block leading-tight tracking-tight">
                  KETHWADI
                </span>
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                  AgriHub Menu
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-emerald-100/60 transition active:scale-95"
              aria-label="Close Navigation Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {currentUser && (
              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/70 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  {userProfile?.photoUrl ? (
                    <img
                      src={userProfile.photoUrl}
                      alt={userProfile.name}
                      className="w-9 h-9 rounded-xl object-cover border border-emerald-300"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {userProfile?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm text-gray-900 block truncate">
                      {userProfile?.name || 'User'}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold capitalize block truncate">
                      Active: {userProfile?.role?.replace('_', ' ') || 'User'}
                    </span>
                  </div>
                </div>

                {/* Mobile Role Switcher */}
                <div className="pt-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-800/80 mb-1.5 tracking-wider">
                    Switch Mode
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        handleRoleSwitch('farmer');
                        setMobileMenuOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                        userProfile?.role === 'farmer'
                          ? 'bg-emerald-700 text-white font-bold shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50'
                      }`}
                    >
                      Farmer
                    </button>
                    <button
                      onClick={() => {
                        handleRoleSwitch('land_owner');
                        setMobileMenuOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                        userProfile?.role === 'land_owner'
                          ? 'bg-emerald-700 text-white font-bold shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50'
                      }`}
                    >
                      Land Owner
                    </button>
                    {(isAdmin || currentUser?.email === 'katrusanjay70@gmail.com') && (
                      <button
                        onClick={() => {
                          handleRoleSwitch('admin');
                          setMobileMenuOpen(false);
                        }}
                        className={`col-span-2 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                          userProfile?.role === 'admin'
                            ? 'bg-amber-600 text-white font-bold shadow-xs'
                            : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        Admin Portal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Farmer Navigation Links */}
            {currentUser && isFarmer && (
              <div className="space-y-1">
                <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Farmer Services
                </div>
                <button
                  onClick={() => {
                    onNavigate('farmer_dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'farmer_dashboard' || currentPage === 'find_land'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" /> Find Farmland
                </button>
                <button
                  onClick={() => {
                    onNavigate('farming_work');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'farming_work'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" /> My Farming Work
                </button>
                <button
                  onClick={() => {
                    onNavigate('insurance');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'insurance'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0" /> Life Insurance
                </button>
                <button
                  onClick={() => {
                    onNavigate('loans');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'loans'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Coins className="w-4 h-4 text-emerald-600 shrink-0" /> Agri Loans
                </button>
                <button
                  onClick={() => {
                    onNavigate('seed_support');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'seed_support'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Wheat className="w-4 h-4 text-emerald-600 shrink-0" /> Seed Support
                </button>
              </div>
            )}

            {/* Land Owner Navigation Links */}
            {currentUser && isLandOwner && (
              <div className="space-y-1">
                <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Land Owner Hub
                </div>
                <button
                  onClick={() => {
                    onNavigate('landowner_dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'landowner_dashboard' || currentPage === 'my_lands'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-600 shrink-0" /> My Farmlands
                </button>
                <button
                  onClick={() => {
                    onNavigate('add_land');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'add_land'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" /> Add New Land
                </button>
                <button
                  onClick={() => {
                    onNavigate('landowner_farmers');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'landowner_farmers'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" /> Working Farmers
                </button>
                <button
                  onClick={() => {
                    onNavigate('insurance');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'insurance'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0" /> Life Insurance
                </button>
              </div>
            )}

            {/* Admin Links */}
            {currentUser && isAdmin && (
              <div className="space-y-1">
                <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-amber-600/80">
                  Administration
                </div>
                <button
                  onClick={() => {
                    onNavigate('admin_dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'admin_dashboard'
                      ? 'bg-amber-100 text-amber-950'
                      : 'text-amber-900 hover:bg-amber-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-600 shrink-0" /> Admin Console
                </button>
              </div>
            )}

            {/* Account & Profile (Logged In) */}
            {currentUser && (
              <div className="pt-2 border-t border-gray-100 space-y-1">
                <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Account
                </div>
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                    currentPage === 'profile'
                      ? 'bg-emerald-100 text-emerald-950 font-bold'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <UserIcon className="w-4 h-4 text-emerald-600 shrink-0" /> Profile & Settings
                </button>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left px-3.5 py-3 rounded-xl bg-red-50 text-red-700 font-bold hover:bg-red-100 flex items-center gap-2.5 text-sm mt-3 border border-red-200 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            )}

            {/* Guest Menu (Not Logged In) */}
            {!currentUser && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    Connecting farmers with prime agricultural land, government-backed insurance, and seasonal agri loans across India.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Explore
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('find_land');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                      currentPage === 'find_land'
                        ? 'bg-emerald-100 text-emerald-950 font-bold'
                        : 'text-emerald-900 hover:bg-emerald-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" /> Explore Farmlands
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('insurance');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                      currentPage === 'insurance'
                        ? 'bg-emerald-100 text-emerald-950 font-bold'
                        : 'text-emerald-900 hover:bg-emerald-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0" /> Life Insurance Policies
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('loans');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-sm transition ${
                      currentPage === 'loans'
                        ? 'bg-emerald-100 text-emerald-950 font-bold'
                        : 'text-emerald-900 hover:bg-emerald-50'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-emerald-600 shrink-0" /> Agri Loans
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      onOpenAuth('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 text-center font-bold text-emerald-900 border border-emerald-300 rounded-xl text-sm hover:bg-emerald-50 transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth('register');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 text-center font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl text-sm shadow-xs transition"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('admin_login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 text-center text-xs font-bold text-amber-900 border border-amber-300 rounded-xl bg-amber-50 hover:bg-amber-100/70 transition flex items-center justify-center gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" /> Admin Staff Portal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/70 shrink-0 text-center">
            <p className="text-[11px] text-gray-500 font-medium">
              Kethwadi AgriHub &bull; Secure Farmland Network
            </p>
          </div>
        </aside>
      </div>
    </header>
  );
};
