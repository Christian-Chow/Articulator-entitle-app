'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ForgotPasswordPageProps = {
  onBack: () => void;
};

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

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

      setMessage('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 auth-enter">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to Login</span>
      </button>

      <div className="w-full rounded-2xl overflow-hidden mb-6 shadow-sm border border-slate-100">
        <Image
          src="/auth_banner-min.png"
          alt=""
          width={1200}
          height={160}
          priority
          quality={85}
          className="w-full h-40 object-cover object-center"
        />
      </div>

      <div className="mb-8">
        <h3 className="font-medium text-2xl text-slate-800 mb-2">
          Reset Your Password
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-[11px] text-red-600 font-medium">{error}</p>
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-[11px] text-green-700 font-medium">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-100 shadow-sm transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white rounded-2xl py-4 font-medium uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Remember your password?{' '}
          <button
            type="button"
            onClick={onBack}
            className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
