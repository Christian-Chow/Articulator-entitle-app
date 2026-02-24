'use client'

import React, { useState } from 'react';
import { Nfc, X } from 'lucide-react';

type EncodeType = 'url' | 'text';

type NfcEncodePageProps = {
  onEncode: (type: EncodeType, value: string) => void;
};

const NfcEncodePage: React.FC<NfcEncodePageProps> = ({ onEncode }) => {
  const [encodeType, setEncodeType] = useState<EncodeType>('url');
  const [value, setValue] = useState('');
  const [showEncodeSheet, setShowEncodeSheet] = useState(false);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onEncode(encodeType, trimmed);
      setShowEncodeSheet(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Segmented control: URL / Text */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setEncodeType('url')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              encodeType === 'url'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setEncodeType('text')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              encodeType === 'text'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Text
          </button>
        </div>

        {/* Input field */}
        <div>
          <input
            type={encodeType === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={encodeType === 'url' ? 'https://example.com' : 'Enter text...'}
            className="w-full px-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            autoComplete="off"
          />
        </div>

        {/* Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full py-4 bg-emerald-600 text-white font-medium rounded-2xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          Write to tag
        </button>
      </div>

      {/* Bottom sheet: Ready to encode */}
      {showEncodeSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowEncodeSheet(false)}
            aria-hidden="true"
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl pb-24 animate-slide-up">
            <div className="flex justify-end p-4 pt-5">
              <button
                onClick={() => setShowEncodeSheet(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-8 pb-4 flex flex-col items-center text-center">
              <h3 className="text-3xl font-semibold text-slate-900 mb-6">Ready to encode</h3>
              <div className="w-28 h-28 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6">
                <Nfc size={64} strokeWidth={1.5} />
              </div>
              <p className="text-base text-slate-500 leading-relaxed max-w-[280px]">
                Put your phone near the NFC tag to write your {encodeType === 'url' ? 'URL' : 'text'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NfcEncodePage;
export type { EncodeType };
