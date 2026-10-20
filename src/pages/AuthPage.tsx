import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Shield,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sun,
  Moon,
  BadgeCheck,
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export type AuthViewMode = 'citizen_signin' | 'citizen_signup' | 'admin_signin';

interface AuthPageProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  darkMode = false,
  onToggleDarkMode,
}) => {
  const {
    signInWithEmail,
    signInAsAdmin,
    signUpWithEmail,
    resetPassword,
  } = useAuth();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<AuthViewMode>('citizen_signin');

  // Citizen credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState(ADMIN_EMAIL);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSignUp = viewMode === 'citizen_signup';
  const isAdminMode = viewMode === 'admin_signin';

  const validateCitizen = () => {
    setErrorMessage(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return false;
    }

    if (isSignUp) {
      if (!name.trim() || name.trim().length < 2) {
        setErrorMessage('Full name must be at least 2 characters');
        return false;
      }
    }

    return true;
  };

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCitizen()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name, phone);
        showToast('Account created successfully! Welcome to mini eCitizen.', 'success');
      } else {
        await signInWithEmail(email, password);
        showToast('Signed in successfully.', 'success');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify and try again.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No citizen account found with this email. Please click "Create an Account".';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account already exists with this email address. Please switch to Sign In.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please wait a minute or reset your password.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network connection problem. Please check your internet connection.';
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = adminEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid administrator email address');
      return;
    }

    if (!adminPassword || adminPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signInAsAdmin(cleanEmail, adminPassword);
      showToast('Authenticated as Administrator. Directing to Admin Command Center...', 'success');
    } catch (err: any) {
      console.error('Admin login error:', err);
      let msg = err.message || 'Failed to authenticate administrator credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password for the administrator account.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No administrator account found with this email.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please wait a moment or reset your password.';
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setSendingReset(true);
    try {
      await resetPassword(forgotEmail);
      showToast('Password reset link sent to your email inbox', 'success');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err: any) {
      showToast(err.message || 'Failed to send password reset email', 'error');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors relative selection:bg-blue-600 selection:text-white">
      {/* Top utility bar with Light/Dark theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Decorative ambient backdrop */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/20 ring-1 ring-white/20 mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          mini eCitizen
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Public Service Request & Municipal Resolution System
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="mt-6 sm:mt-8 w-full max-w-md px-3 sm:px-0 mx-auto relative z-10">
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
          {/* Top side edges to the curved corners colored with the signing button color */}
          <div
            className={`h-2.5 sm:h-3 w-full transition-all duration-300 ${
              isAdminMode
                ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}
          />

          <div className="py-6 px-4 sm:py-8 sm:px-8">

          {/* ============================================================== */}
          {/* ADMINISTRATOR OFFICIAL SIGN IN VIEW                             */}
          {/* ============================================================== */}
          {isAdminMode ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Administrator Login</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Official Municipal Authority</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('citizen_signin');
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Citizen Portal</span>
                </button>
              </div>

              {/* Informational badge */}
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <BadgeCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Authorized officials sign in with verified municipal credentials.</span>
              </div>

              {/* Friendly Validation Alert if present */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {/* Administrator Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Administrator Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="francisnjogu157@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                {/* Admin Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Admin Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(adminEmail);
                        setShowForgotModal(true);
                      }}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter administrator password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-900/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Administrator...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sign In to Admin Center</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* ============================================================== */
            /* CITIZEN PORTAL: SIGN IN OR CREATE AN ACCOUNT                   */
            /* ============================================================== */
            <div>
              {/* Toggle: Sign In vs Create an Account */}
              <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('citizen_signin');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 sm:py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'citizen_signin'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('citizen_signup');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 sm:py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'citizen_signup'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Create an Account
                </button>
              </div>

              {/* Friendly Validation Alert if present */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleCitizenSubmit} className="space-y-4">
                {isSignUp && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Jane Wanjiru"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+254 700 000 000"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="citizen@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setShowForgotModal(true);
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-900/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{isSignUp ? 'Create an Account' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Discrete Administrator Portal access: ONLY on Sign In (REMOVED from Sign Up as requested) */}
              {!isSignUp && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('admin_signin');
                      setErrorMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Administrator / Official Sign In ➔</span>
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Account Password</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your registered email address to receive password reset instructions.
            </p>

            <form onSubmit={handleSendReset} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReset}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {sendingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Send Reset Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
