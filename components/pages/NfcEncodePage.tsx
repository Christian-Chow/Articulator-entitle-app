'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Nfc, X, CheckCircle, AlertTriangle } from 'lucide-react';

// Minimal Web NFC API type declarations
interface NDEFRecordInit {
  recordType: string;
  data: string;
}
interface NDEFMessageInit {
  records: NDEFRecordInit[];
}
interface NDEFWriteOptions {
  signal?: AbortSignal;
}
interface NDEFReaderInstance {
  write(message: NDEFMessageInit, options?: NDEFWriteOptions): Promise<void>;
}
declare const NDEFReader: { new(): NDEFReaderInstance };

type EncodeType = 'url' | 'text';
type WriteState = 'idle' | 'waiting' | 'success' | 'error';

type NfcEncodePageProps = {
  onEncode: (type: EncodeType, value: string) => void;
};

const NfcEncodePage: React.FC<NfcEncodePageProps> = ({ onEncode }) => {
  const [encodeType, setEncodeType] = useState<EncodeType>('url');
  const [value, setValue] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [writeState, setWriteState] = useState<WriteState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const isSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  // Abort any pending write when component unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (encodeType === 'url' && !validateUrl(trimmed)) {
      setErrorMessage('Please enter a valid URL (e.g. https://example.com)');
      setWriteState('error');
      setShowSheet(true);
      return;
    }

    onEncode(encodeType, trimmed);
    setWriteState('waiting');
    setErrorMessage('');
    setShowSheet(true);

    if (!isSupported) {
      setErrorMessage('NFC writing requires Android with Chrome. Not supported on this device.');
      setWriteState('error');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const ndef = new NDEFReader();
      await ndef.write(
        { records: [{ recordType: encodeType === 'url' ? 'url' : 'text', data: trimmed }] },
        { signal: controller.signal }
      );
      if (!controller.signal.aborted) {
        setWriteState('success');
      }
    } catch (err) {
      if (controller.signal.aborted) return; // user dismissed — ignore
      const message = err instanceof Error ? err.message : 'Write failed';
      setErrorMessage(message);
      setWriteState('error');
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setShowSheet(false);
    setWriteState('idle');
    setErrorMessage('');
  };

  const handleRetry = () => {
    setShowSheet(false);
    setWriteState('idle');
    setErrorMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">

        {/* Unsupported device notice */}
        {!isSupported && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>NFC writing requires Android with Chrome. Not supported on this device.</span>
          </div>
        )}

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

      {/* Bottom sheet */}
      {showSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl pb-24 animate-slide-up">
            <div className="flex justify-end p-4 pt-5">
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-8 pb-4 flex flex-col items-center text-center">
              {writeState === 'waiting' && (
                <>
                  <h3 className="text-3xl font-semibold text-slate-900 mb-6">Ready to encode</h3>
                  <div className="w-28 h-28 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6 animate-pulse">
                    <Nfc size={64} strokeWidth={1.5} />
                  </div>
                  <p className="text-base text-slate-500 leading-relaxed max-w-[280px]">
                    Hold your phone near the NFC tag to write your {encodeType === 'url' ? 'URL' : 'text'}
                  </p>
                </>
              )}

              {writeState === 'success' && (
                <>
                  <h3 className="text-3xl font-semibold text-slate-900 mb-6">Tag written!</h3>
                  <div className="w-28 h-28 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6">
                    <CheckCircle size={64} strokeWidth={1.5} />
                  </div>
                  <p className="text-base text-slate-500 leading-relaxed max-w-[280px] mb-8">
                    Your {encodeType === 'url' ? 'URL' : 'text'} was written to the tag successfully.
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full py-4 bg-emerald-600 text-white font-medium rounded-2xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
                  >
                    Done
                  </button>
                </>
              )}

              {writeState === 'error' && (
                <>
                  <h3 className="text-3xl font-semibold text-slate-900 mb-6">Write failed</h3>
                  <div className="w-28 h-28 flex items-center justify-center rounded-full bg-red-50 text-red-500 mb-6">
                    <AlertTriangle size={64} strokeWidth={1.5} />
                  </div>
                  <p className="text-base text-slate-500 leading-relaxed max-w-[280px] mb-8">
                    {errorMessage}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="w-full py-4 bg-slate-900 text-white font-medium rounded-2xl shadow-sm hover:bg-slate-700 active:scale-[0.98] transition-all"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NfcEncodePage;
export type { EncodeType };
