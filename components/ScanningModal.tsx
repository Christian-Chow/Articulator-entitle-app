'use client'

import React from 'react';
import { Cpu, QrCode } from 'lucide-react';

type ScanningModalProps = {
  isScanning: boolean;
  activeScanType: string;
  onCancel: () => void;
};

const ScanningModal: React.FC<ScanningModalProps> = ({ isScanning, activeScanType, onCancel }) => {
  if (!isScanning) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white p-8 modal-fade-in">
      <div className="w-72 h-72 border border-white/20 rounded-[3.5rem] relative overflow-hidden bg-white/5 backdrop-blur-sm">
        <div className="absolute inset-x-8 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_30px_rgba(129,140,248,0.5)] animate-scan-line" />
        <div className="absolute top-10 left-10 w-6 h-6 border-t border-l border-white/40" />
        <div className="absolute top-10 right-10 w-6 h-6 border-t border-r border-white/40" />
        <div className="absolute bottom-10 left-10 w-6 h-6 border-b border-l border-white/40" />
        <div className="absolute bottom-10 right-10 w-6 h-6 border-b border-r border-white/40" />
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          {activeScanType === 'NFC' ? (
            <Cpu size={120} strokeWidth={0.5} />
          ) : (
            <QrCode size={120} strokeWidth={0.5} />
          )}
        </div>
      </div>
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-serif tracking-wide">
          {activeScanType === 'NFC' ? 'Awaiting Tag...' : `Reading ${activeScanType}...`}
        </h2>
        <p className="mt-3 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-medium max-w-[220px] mx-auto leading-relaxed">
          {activeScanType === 'NFC'
            ? 'Hold your device near the piece identifier'
            : `Align the ${activeScanType} on the physical piece within the frame`}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="mt-20 px-10 py-3 bg-white/5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};

export default ScanningModal;
