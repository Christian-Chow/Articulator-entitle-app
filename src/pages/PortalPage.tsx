import React from 'react';
import { ChevronRight, Cpu, QrCode, Scan, ShieldCheck } from 'lucide-react';

type PortalPageProps = {
  onScan: (type: string) => void;
};

const PortalPage: React.FC<PortalPageProps> = ({ onScan }) => (
  <div className="mt-4 gateway-enter">
    <div className="mb-8 px-1">
      <h3 className="font-serif text-xl italic text-slate-800 mb-2">Identify Artwork</h3>
      <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-tighter">
        Choose a verification method to unlock the digital registry for your physical piece.
      </p>
    </div>

    <div className="space-y-4">
      <button
        onClick={() => onScan('PiCode')}
        className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-6 text-slate-900 shadow-sm flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden text-left"
      >
        <div className="bg-slate-900 p-4 rounded-3xl group-hover:scale-110 transition-transform shrink-0">
          <QrCode size={32} strokeWidth={1.5} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-serif italic">Scan PiCode</h4>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-0.5">Primary Visual ID</p>
        </div>
        <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
      </button>

      <button
        onClick={() => onScan('QR Code')}
        className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-6 text-slate-900 shadow-sm flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden text-left"
      >
        <div className="bg-blue-50 text-blue-600 p-4 rounded-3xl group-hover:scale-110 transition-transform shrink-0">
          <Scan size={32} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-serif italic">Scan QR Code</h4>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-0.5">Universal Tracking</p>
        </div>
        <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
      </button>

      <button
        onClick={() => onScan('NFC')}
        className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-6 text-slate-900 shadow-sm flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden text-left"
      >
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-3xl group-hover:scale-110 transition-transform shrink-0">
          <Cpu size={32} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-serif italic">NFC Registry</h4>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-0.5">Tap Interaction</p>
        </div>
        <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
      </button>
    </div>

    <div className="mt-12 text-center">
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
        <ShieldCheck size={12} />
        Secured by Articulator Intelligence
      </p>
    </div>
  </div>
);

export default PortalPage;
