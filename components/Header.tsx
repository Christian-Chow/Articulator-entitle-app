'use client'

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, LayoutGrid, LogIn, LogOut } from 'lucide-react';

// Metamask logo (uses official asset from public folder)
const MetamaskLogo = ({ size = 16 }: { size?: number }) => (
  <img src="/metamask.png" alt="MetaMask" width={size} height={size} className="object-contain" />
);

type HeaderProps = {
  subtitle: string;
  title: string;
  isLoggedIn: boolean;
  onLoginToggle: () => void;
  onLogoClick: () => void;
  isAuthView?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onGuestWalletConnect?: () => void;
};

const Header: React.FC<HeaderProps> = ({
  subtitle,
  title,
  isLoggedIn,
  onLoginToggle,
  onLogoClick,
  isAuthView = false,
  showBack = false,
  onBack,
  onGuestWalletConnect,
}) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(e.target as Node)) {
        setShowWalletDropdown(false);
      }
    };
    if (showWalletDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWalletDropdown]);

  const handleWalletOptionClick = () => {
    if (!isLoggedIn && onGuestWalletConnect) {
      onGuestWalletConnect();
      setShowWalletDropdown(false);
      return;
    }
    setIsWalletConnected(!isWalletConnected);
    setShowWalletDropdown(false);
  };

  return (
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
        {(isAuthView || showBack) && onBack ? (
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
        <div className="relative" ref={walletDropdownRef}>
            <button
              onClick={() => setShowWalletDropdown(!showWalletDropdown)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all active:scale-95 ${
                isWalletConnected
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                  : 'bg-orange-500 text-white shadow-sm ring-1 ring-white/20 hover:bg-orange-400'
              }`}
              title={isWalletConnected ? 'Wallet options' : 'Choose wallet'}
            >
              {isWalletConnected ? (
                <MetamaskLogo size={14} />
              ) : (
                <LayoutGrid size={14} className="shrink-0" strokeWidth={2} />
              )}
              <span className="text-[9px] font-bold uppercase tracking-tighter">
                {isWalletConnected ? 'Connected' : 'Connect Wallet'}
              </span>
              <ChevronDown size={12} className={`shrink-0 transition-transform ${showWalletDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showWalletDropdown && (
              <div className="absolute right-0 top-full mt-1.5 py-1.5 min-w-[200px] bg-white rounded-2xl border border-slate-100 shadow-lg z-50">
                <div className="px-4 pb-2 pt-1">
                  <p className="text-[11px] font-semibold text-slate-900">
                    Select Wallet Provider
                  </p>
                </div>
                <button
                  onClick={handleWalletOptionClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <MetamaskLogo size={20} />
                  <span className="text-sm font-medium text-slate-800">MetaMask</span>
                  {isWalletConnected && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              </div>
            )}
          </div>
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
};

export default Header;
