import React, { useState } from 'react';
import { AtSign, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

type LoginPageProps = {
  onSuccess: () => void;
};

const inputClass =
  'w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-100 shadow-sm transition-all';

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [eulaAccepted, setEulaAccepted] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError(false);

    if (authMode === 'signup') {
      const form = e.target as HTMLFormElement;
      const p = (form.elements.namedItem('password') as HTMLInputElement)?.value ?? '';
      const cp = (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value ?? '';
      if (p !== cp) {
        setConfirmError(true);
        return;
      }
    }

    onSuccess();
  };

  const switchMode = (next: 'login' | 'signup') => {
    setAuthMode(next);
    setConfirmError(false);
    if (next === 'login') setEulaAccepted(false);
  };

  return (
    <div className="mt-2 auth-enter">
      <div className="w-full rounded-2xl overflow-hidden mb-6 shadow-sm border border-slate-100">
        <img
          src="/auth_banner-min.png"
          alt=""
          className="w-full h-40 object-cover object-center"
        />
      </div>
      <div className="mb-8">
        <h3 className="font-serif text-2xl italic text-slate-800 mb-2">
          {authMode === 'signup' ? 'Create Account' : 'Login to Articulator'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-widest font-medium">
          {authMode === 'signup' ? 'Join Articulator' : 'Sign in to access your collection'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {authMode === 'signup' && (
          <>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                name="username"
                placeholder="Username"
                className={inputClass.replace('pr-12', 'pr-4')}
                required
              />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className={inputClass.replace('pr-12', 'pr-4')}
                required
              />
            </div>
          </>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            className={inputClass.replace('pr-12', 'pr-4')}
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            className={inputClass}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {authMode === 'signup' && (
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              className={`${inputClass.replace('pr-12', 'pr-4')} ${confirmError ? 'border-red-200 focus:ring-red-100' : ''}`}
              required
            />
            {confirmError && (
              <p className="mt-1.5 text-[10px] text-red-500 font-medium">Passwords do not match</p>
            )}
          </div>
        )}

        {authMode === 'signup' && (
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={eulaAccepted}
                onChange={(e) => setEulaAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-100"
              />
              <span className="text-[11px] text-slate-600 leading-snug">
                I accept the <span className="text-indigo-600 font-medium">End User License Agreement</span>
              </span>
            </label>
            <p className="mt-1.5 ml-7 text-[10px] text-slate-400">
              By clicking this checkbox, you agree to the end user license agreement.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={authMode === 'signup' && !eulaAccepted}
          className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {authMode === 'signup' ? 'Get Started' : 'Sign In'}
        </button>
      </form>

      <div className="mt-12 text-center border-t border-slate-100 pt-8">
        <button
          type="button"
          onClick={() => switchMode(authMode === 'signup' ? 'login' : 'signup')}
          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
        >
          {authMode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
