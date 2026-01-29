'use client'

import React from 'react';
import { History, Info, Palette, Scan, Settings } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export type View = 'portal' | 'home' | 'archive' | 'guide' | 'profile' | 'auth' | 'forgot-password';

type NavigationProps = {
  currentView: View;
  onNavigate: (view: View) => void;
};

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
    <button
      onClick={() => onNavigate('portal')}
      className={`flex flex-col items-center gap-1 ${currentView === 'portal' ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <Palette size={24} fill={currentView === 'portal' ? 'currentColor' : 'none'} strokeWidth={1.5} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
    </button>
    <button
      onClick={() => onNavigate('archive')}
      className={`flex flex-col items-center gap-1 ${currentView === 'archive' ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <History size={24} strokeWidth={1.5} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Archive</span>
    </button>
    <div className="relative -top-8">
      <button
        onClick={() => {}}
        className="bg-slate-900 text-white p-4 rounded-full shadow-2xl shadow-slate-400 border-4 border-white active:scale-95 transition-transform"
      >
        <Scan size={32} />
      </button>
    </div>
    <button
      onClick={() => onNavigate('guide')}
      className={`flex flex-col items-center gap-1 ${currentView === 'guide' ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <Info size={24} strokeWidth={1.5} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Guide</span>
    </button>
    <button
      onClick={() => onNavigate('profile')}
      className={`flex flex-col items-center gap-1 ${currentView === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}
    >
      <Settings size={24} strokeWidth={1.5} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
    </button>
  </nav>
);

export default Navigation;
