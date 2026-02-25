'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  ChevronRight,
  History,
  Library,
  Maximize,
  Play,
  Printer,
  Tv,
  Users,
  Wallet,
} from 'lucide-react';

type IconComponent = typeof Award;

type MenuOption = {
  id: string;
  label: string;
  icon: IconComponent;
  desc: string;
  color: string;
};

const menuOptions: MenuOption[] = [
  { id: 'coa', label: 'View COA', icon: Award, desc: 'Digital Certificate of Authenticity', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'ar', label: 'AR 3D Effect', icon: Maximize, desc: 'View artwork in your physical space', color: 'bg-blue-50 text-blue-600' },
  { id: 'animation', label: 'Animation', icon: Play, desc: 'Unlock motion layers of the piece', color: 'bg-purple-50 text-purple-600' },
  { id: 'provenance', label: 'Provenance', icon: History, desc: 'Trace the complete ownership history', color: 'bg-amber-50 text-amber-600' },
  { id: 'collection', label: 'My Collection', icon: Library, desc: 'Manage your private digital gallery', color: 'bg-rose-50 text-rose-600' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, desc: 'Access your blockchain assets', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'print', label: 'Order Print', icon: Printer, desc: 'Request high-fidelity physical copies', color: 'bg-slate-50 text-slate-600' },
  { id: 'cast', label: 'Cast to TV', icon: Tv, desc: 'Stream to compatible smart displays', color: 'bg-cyan-50 text-cyan-600' },
  { id: 'community', label: 'Community', icon: Users, desc: 'Connect with fellow collectors', color: 'bg-orange-50 text-orange-600' },
];

type MenuOptionProps = {
  isLoggedIn: boolean;
  artworkId: string;
};

const MenuOption: React.FC<MenuOptionProps> = ({ isLoggedIn, artworkId }) => {
  const router = useRouter();

  const handleOptionClick = (optionId: string) => {
    if (optionId === 'coa') {
      router.push(`/artworks/${artworkId}/coa`);
    }
  };

  return (
    <div className="home-enter">
      <section>
        <div className="flex items-end justify-between mb-5 px-1">
          <h3 className="font-medium text-xl text-slate-800">Explore Services</h3>
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Registry v2.4</span>
        </div>

        <div className="space-y-3">
          {menuOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => handleOptionClick(opt.id)}
                className="w-full bg-white border border-slate-50 p-4 rounded-[1.8rem] shadow-sm flex items-center gap-4 group active:scale-[0.98] transition-all hover:border-slate-100 hover:shadow-md text-left"
              >
                <div className={`${opt.color} p-3 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-medium text-slate-800 tracking-wide uppercase mb-0.5">{opt.label}</span>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{opt.desc}</p>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default MenuOption;
