'use client'

import React from 'react';
import { ChevronRight, PenLine, Scan } from 'lucide-react';

type NfcPageProps = {
  onNfcRead: () => void;
  onNfcWrite: () => void;
};

const NfcPage: React.FC<NfcPageProps> = ({ onNfcRead, onNfcWrite }) => (
  <div className="min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center gateway-enter">
    <div className="w-full max-w-md space-y-4">
      <button
        onClick={onNfcRead}
        className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-6 text-slate-900 shadow-sm flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden text-left"
      >
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-3xl group-hover:scale-110 transition-transform shrink-0">
          <PenLine size={32} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h4 className="text-xl font-medium text-black">NFC Encode</h4>
          <p className="text-sm text-slate-500 mt-0.5">Encode to tag</p>
        </div>
        <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
      </button>

      <button
        onClick={onNfcWrite}
        className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-6 text-slate-900 shadow-sm flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden text-left"
      >
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-3xl group-hover:scale-110 transition-transform shrink-0">
          <Scan size={32} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h4 className="text-xl font-medium text-black">NFC Read</h4>
          <p className="text-sm text-slate-500 mt-0.5">Read from tag</p>
        </div>
        <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
      </button>
    </div>
  </div>
);

export default NfcPage;
