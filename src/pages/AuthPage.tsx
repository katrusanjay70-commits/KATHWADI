import React, { useState } from 'react';
import {
  Sprout,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'admin';
  onSuccess: (role: UserRole) => void;
  onCancel?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onSuccess, onCancel }) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(initialMode);
  const [role, setRole] = useState<UserRole>('farmer');

  // Form fields
  const [email, setEmail] = useState(mode === 'admin' ? 'katrusanjay70@gmail.com' : '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim()) throw new Error('Please enter your email address');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long');

        await registerWithEmail(email.trim(), password, name.trim(), role, phone.trim(), location.trim());
        onSuccess(role);
      } else if (mode === 'admin') {
        if (!email.trim() || !password) throw new Error('Please enter admin email and password');
        await loginWithEmail(email.trim(), password);
        onSuccess('admin');
      } else {
        if (!email.trim() || !password) throw new Error('Please enter both email and password');
        await loginWithEmail(email.trim(), password);
        onSuccess(role);
      }
    } catch (err: any) {
      const isOpNotAllowed =
        err?.code === 'auth/operation-not-allowed' ||
        String(err?.message || '').includes('auth/operation-not-allowed');

      if (isOpNotAllowed) {
        console.warn('Firebase Auth notice: Email/Password sign-in provider is not enabled in Firebase Console for this project.');
      } else {
        console.warn('Authentication status notice:', err?.message || err);
      }

      let msg = err?.message || 'Authentication failed. Please verify your credentials.';
      if (isOpNotAllowed) {
        msg = 'Email/Password sign-in is not yet enabled in the linked Firebase Console (Authentication > Sign-in method). Please enable Email/Password provider, or continue using Demo Account.';
      } else if (
        msg.includes('auth/invalid-credential') ||
        msg.includes('auth/wrong-password') ||
        msg.includes('auth/user-not-found')
      ) {
        msg = 'Invalid credentials. Please check your email and password.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists. Please Sign In.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'The password is too weak. Please use at least 6 characters.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (mode === 'admin') return;
    setErrorMessage('');
    setLoading(true);
    try {
      await loginWithGoogle(role);
      onSuccess(role);
    } catch (err: any) {
      console.warn('Google sign-in notice:', err?.message || err);
      setErrorMessage(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (targetRole: UserRole) => {
    loginAsDemo(targetRole);
    onSuccess(targetRole);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/50 to-white">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100 p-4 sm:p-8">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div
            className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white mb-3 shadow-md ${
              mode === 'admin' ? 'bg-amber-600 shadow-amber-600/20' : 'bg-emerald-700 shadow-emerald-700/20'
            }`}
          >
            {mode === 'admin' ? (
              <LayoutDashboard className="w-6 h-6 text-amber-200" />
            ) : (
              <Sprout className="w-7 h-7 text-emerald-200" />
            )}
          </div>
          <h2 className="text-2xl font-black text-emerald-950 tracking-tight font-serif">
            {mode === 'admin'
              ? 'KETHWADI Admin Portal'
              : mode === 'login'
              ? 'Welcome Back to KETHWADI'
              : 'Join KETHWADI'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-700 mt-1 font-medium">
            {mode === 'admin'
              ? 'Secure staff access for farmland & worker administration'
              : mode === 'login'
              ? 'Access your farmland and agriculture dashboard'
              : 'Connecting cultivators and landowners across India'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-emerald-50 p-1 rounded-2xl mb-6 border border-emerald-200/60">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'login'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'register'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setErrorMessage('');
              setEmail('katrusanjay70@gmail.com');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'admin'
                ? 'bg-amber-500 text-emerald-950 shadow-xs'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Role Selection (Mandatory for registration) */}
        {mode === 'register' && (
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
              Select Your Role <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div
                onClick={() => setRole('farmer')}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center sm:flex-col sm:items-center gap-3 sm:gap-1 text-left sm:text-center ${
                  role === 'farmer'
                    ? 'border-emerald-700 bg-emerald-50/80 shadow-xs'
                    : 'border-emerald-100 hover:border-emerald-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    role === 'farmer' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <Sprout className="w-5 h-5" />
                </div>
                <div className="flex-1 sm:flex-initial">
                  <span className="text-xs font-bold text-emerald-950 block">Farmer</span>
                  <span className="text-[10px] text-emerald-700 leading-tight block">
                    Discover arable land & cultivate
                  </span>
                </div>
                {role === 'farmer' && (
                  <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                    Selected
                  </span>
                )}
              </div>

              <div
                onClick={() => setRole('land_owner')}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center sm:flex-col sm:items-center gap-3 sm:gap-1 text-left sm:text-center ${
                  role === 'land_owner'
                    ? 'border-emerald-700 bg-emerald-50/80 shadow-xs'
                    : 'border-emerald-100 hover:border-emerald-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    role === 'land_owner' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 sm:flex-initial">
                  <span className="text-xs font-bold text-emerald-950 block">Land Owner</span>
                  <span className="text-[10px] text-emerald-700 leading-tight block">
                    List farmlands for cultivation
                  </span>
                </div>
                {role === 'land_owner' && (
                  <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                    Selected
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-emerald-950 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel / Sanjay Kumar"
                  className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-emerald-950 mb-1">
              {mode === 'admin' ? 'Administrator Email' : 'Email Address'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="katrusanjay70@gmail.com"
                className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-950 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">District / Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Warangal, Guntur"
                    className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-2 ${
              mode === 'admin'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/20'
            }`}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'admin'
                    ? 'Login to Admin Dashboard'
                    : mode === 'login'
                    ? 'Sign In to Dashboard'
                    : 'Register & Continue'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Google 1-Click Sign-in for Farmers and Land Owners ONLY */}
        {mode !== 'admin' ? (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-emerald-200/80"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 font-semibold">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full border border-gray-300 hover:border-emerald-600 hover:bg-emerald-50/50 bg-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm text-gray-800 transition flex items-center justify-center gap-3 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        ) : (
          <div className="mt-5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-center text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center justify-center gap-1.5 text-amber-950">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              Direct Staff Authentication Enforced
            </span>
            <p className="text-[11px] text-amber-800/80">
              Google Single Sign-On is disabled for Administrative and Staff access for heightened security compliance.
            </p>
          </div>
        )}

        {/* Quick Demo Options */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="text-center mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Quick Test / Demo Access
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn('farmer')}
              className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition text-center"
            >
              Demo Farmer
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('land_owner')}
              className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition text-center"
            >
              Demo Owner
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('admin')}
              className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition text-center"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {onCancel && (
          <div className="mt-4 text-center">
            <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-800 transition">
              Cancel and return to browsing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
