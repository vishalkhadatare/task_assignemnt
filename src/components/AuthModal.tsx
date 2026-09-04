import React, { useState } from 'react';
import { X, Lock, User, Mail, ShieldCheck, ArrowRight, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { EmiPlan, Product, ProductVariant } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess: (userData: { name: string; phone: string; email: string }) => void;
  product?: Product | null;
  variant?: ProductVariant | null;
  plan?: EmiPlan | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
  product,
  variant,
  plan,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('Vishal Khadatare');
  const [email, setEmail] = useState('vishalkhadatare55@gmail.com');
  const [password, setPassword] = useState('Password@123');
  const [confirmPassword, setConfirmPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync mode with initialMode prop when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onSuccess({
        name: name || 'Vishal Khadatare',
        phone: '9823019283',
        email: email || 'vishalkhadatare55@gmail.com',
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeInUp">
      
      {/* Click outside to dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 z-10 animate-modalEnter">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          id="btn-close-auth-modal"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <span className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            1fi
          </span>
          <h3 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight">
            {mode === 'signup' ? 'Create your 1fi Account' : 'Sign in to 1fi'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Instant digital approval with 0% foreclosure charges
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-lg mb-5 text-sm font-semibold text-gray-600">
          <button
            type="button"
            id="tab-auth-signin"
            onClick={() => {
              setMode('signin');
              setErrorMessage('');
            }}
            className={`py-2 rounded-md transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-auth-signup"
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
            }}
            className={`py-2 rounded-md transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          
          {/* Sign Up: Full Name */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vishal Khadatare"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff5e00]/20 focus:border-[#ff5e00]"
                />
              </div>
            </div>
          )}

          {/* Email Field (Both Sign In & Sign Up) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff5e00]/20 focus:border-[#ff5e00]"
              />
            </div>
          </div>

          {/* Password Field with Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700">Password</label>
              {mode === 'signin' && (
                <span className="text-[11px] text-[#ff5e00] font-semibold cursor-pointer hover:underline">
                  Forgot?
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff5e00]/20 focus:border-[#ff5e00]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
                title={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign Up: Confirm Password with Eye Toggle */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff5e00]/20 focus:border-[#ff5e00]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
                  title={showConfirmPassword ? 'Hide password' : 'View password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            id="btn-auth-submit"
            disabled={loading}
            className="w-full btn-gradient text-white font-bold text-sm py-3 px-4 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : mode === 'signup' ? (
              <>
                <span>Create Account & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Sign In & Continue</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Trust Footnote */}
          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span>100% RBI-compliant · End-to-end 256-bit encrypted</span>
          </div>

        </form>

      </div>
    </div>
  );
};
