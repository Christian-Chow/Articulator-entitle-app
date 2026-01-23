'use client'

import React, { useState } from 'react';
import { AtSign, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setConfirmError(false);
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value ?? '';
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value ?? '';

    try {
      if (authMode === 'signup') {
        const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value ?? '';
        if (password !== confirmPassword) {
          setConfirmError(true);
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: (form.elements.namedItem('username') as HTMLInputElement)?.value ?? '',
              full_name: (form.elements.namedItem('fullName') as HTMLInputElement)?.value ?? '',
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          setMessage('Please check your email to confirm your account.');
        } else if (data.session) {
          onSuccess();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.session) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value ?? '';

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) throw resetError;

      setMessage('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: 'login' | 'signup') => {
    setAuthMode(next);
    setConfirmError(false);
    setError(null);
    setMessage(null);
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
        <h3 className="font-serif text-2xl text-slate-800 mb-2">
          {authMode === 'signup' ? 'Create Account' : 'Login to Articulator'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-widest font-medium">
          {authMode === 'signup' ? 'Join Articulator' : 'Sign in to access your collection'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-[11px] text-red-600 font-medium">{error}</p>
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-[11px] text-slate-700 font-medium">{message}</p>
        </div>
      )}

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
            minLength={6}
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
              minLength={6}
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
          disabled={(authMode === 'signup' && !eulaAccepted) || loading}
          className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? 'Processing...' : authMode === 'signup' ? 'Get Started' : 'Sign In'}
        </button>
      </form>

      {authMode === 'login' && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handlePasswordReset}
            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
          >
            Forgot Password?
          </button>
        </div>
      )}

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
