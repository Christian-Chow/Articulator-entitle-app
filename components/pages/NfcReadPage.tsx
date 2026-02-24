'use client'

import React, { useEffect, useState } from 'react';
import { Nfc, X } from 'lucide-react';

type NfcReadPageProps = {
  // In the future this can be wired to real NFC read logic.
  onTagRead?: (payload: string) => void;
};

const NfcReadPage: React.FC<NfcReadPageProps> = ({ onTagRead }) => {
  const [showSheet, setShowSheet] = useState(true);
  const [capturedInfo, setCapturedInfo] = useState<string | null>(null);

  useEffect(() => {
    // Simulate NFC read after a short delay
    const timer = setTimeout(() => {
      // Placeholder payload for now; value is not shown in UI.
      const payload = 'nfc-tag-data';
      setCapturedInfo(payload);
      setShowSheet(false);
      onTagRead?.(payload);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onTagRead]);

  return (
    <div className="min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center gateway-enter">
      <div className="w-full max-w-md">
        {capturedInfo ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">NFC data detected</h2>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center">
            Waiting for NFC tag...
          </p>
        )}
      </div>

      {showSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            aria-hidden="true"
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl pb-24 animate-slide-up">
            <div className="flex justify-end p-4 pt-5">
              <button
                onClick={() => setShowSheet(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-8 pb-4 flex flex-col items-center text-center">
              <h3 className="text-3xl font-semibold text-slate-900 mb-6">Hold near the tag</h3>
              <div className="w-28 h-28 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6">
                <Nfc size={64} strokeWidth={1.5} />
              </div>
              <p className="text-base text-slate-500 leading-relaxed max-w-[280px]">
                Hold your phone closer to the NFC tag to read its information.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NfcReadPage;

