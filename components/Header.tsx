'use client'

import React from 'react';
import { ArrowLeft, Bell, LogIn, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

type HeaderProps = {
  subtitle: string;
  title: string;
  isLoggedIn: boolean;
  onLoginToggle: () => void;
  onLogoClick: () => void;
  isAuthView?: boolean;
  onBack?: () => void;
};

const Header: React.FC<HeaderProps> = ({
  subtitle,
  title,
  isLoggedIn,
  onLoginToggle,
  onLogoClick,
  isAuthView = false,
  onBack,
}) => (
  <header className="px-6 pt-2 pb-2">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2 group cursor-pointer" onClick={onLogoClick}>
        <img
          src="/logo.svg"
          alt="Articulators"
          className="h-14 w-auto object-contain group-hover:opacity-80 transition-opacity duration-300"
        />
      </div>

      <div className="flex items-center gap-3">
        {isAuthView && onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <ArrowLeft size={16} className="text-slate-400" />
            <span className="text-slate-600 font-bold uppercase tracking-tighter text-[9px]">Back</span>
          </button>
        ) : (
          <button
            onClick={onLoginToggle}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            {isLoggedIn ? (
              <>
                <LogOut size={16} className="text-slate-400" />
                <span className="text-slate-600 font-bold uppercase tracking-tighter text-[9px]">Exit</span>
              </>
            ) : (
              <>
                <LogIn size={16} className="text-slate-600" />
                <span className="text-slate-700 font-bold uppercase tracking-tighter text-[9px]">Login</span>
              </>
            )}
          </button>
        )}
        <button className="relative p-2.5 bg-white border border-slate-100 rounded-2xl text-slate-600 shadow-sm hover:shadow-md transition-all">
          <Bell size={20} />
          {isLoggedIn && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </div>
    </div>

    {!isAuthView && (
      <div className="mb-0">
        <h2 className="text-slate-500 text-sm mb-1">{subtitle}</h2>
        <h1 className="text-2xl font-medium text-black leading-tight">{title}</h1>
      </div>
    )}
  </header>
);

export default Header;
