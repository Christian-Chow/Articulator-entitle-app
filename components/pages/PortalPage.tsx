'use client'

import React, { useRef, useState } from 'react';
import { ChevronRight, Cpu, Info, QrCode, Scan, ShieldCheck, Upload, X } from 'lucide-react';

type PortalPageProps = {
  onScan: (type: string) => void;
  onUploadImage: (file: File) => void;
};

const PortalPage: React.FC<PortalPageProps> = ({ onScan, onUploadImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadImage(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-0 gateway-enter">
      <div className="px-1 flex items-center justify-end mb-1">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50"
          aria-label="Show information"
        >
          <Info size={18} strokeWidth={1.5} />
        </button>
      </div>

      {showInfo && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
            onClick={() => setShowInfo(false)}
          />
          {/* Modal Popup */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full pointer-events-auto animate-scale-in">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg text-slate-800">Identify Artwork</h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50 -mt-1 -mr-1"
                  aria-label="Close information"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-tighter">
                Choose a verification method to unlock the digital registry for your physical piece.
              </p>
            </div>
          </div>
        </>
      )}

      <div className="space-y-4">
      <button
        onClick={() => onScan('PiCode')}
        className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-6 text-slate-900 shadow-sm flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden text-left"
      >
        <div className="bg-slate-900 p-4 rounded-3xl group-hover:scale-110 transition-transform shrink-0">
          <QrCode size={32} strokeWidth={1.5} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-serif">Scan PiCode</h4>
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
          <h4 className="text-lg font-serif">Scan QR Code</h4>
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
          <h4 className="text-lg font-serif">NFC Registry</h4>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-0.5">Tap Interaction</p>
        </div>
        <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-6 text-slate-900 shadow-sm flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden text-left"
      >
        <div className="bg-purple-50 text-purple-600 p-4 rounded-3xl group-hover:scale-110 transition-transform shrink-0">
          <Upload size={32} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-serif">Upload Image</h4>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-0.5">Decode from File</p>
        </div>
        <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldCheck size={12} />
          Secured by Articulator Intelligence
        </p>
      </div>
    </div>
  );
};

export default PortalPage;
