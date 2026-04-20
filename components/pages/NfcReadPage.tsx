'use client'

import React, { useEffect, useState, useRef } from 'react';
import { Nfc, X, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

// Minimal Web NFC API type declarations
interface NDEFRecord {
  recordType: string;
  data: DataView;
}
interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: { records: NDEFRecord[] };
}
interface NDEFReaderInstance {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  addEventListener(type: 'reading', listener: (event: NDEFReadingEvent) => void): void;
  addEventListener(type: 'readingerror', listener: (event: Event) => void): void;
}
declare const NDEFReader: { new(): NDEFReaderInstance };

// URI prefix table per NDEF spec
const URI_PREFIXES: Record<number, string> = {
  0x00: '', 0x01: 'http://www.', 0x02: 'https://www.',
  0x03: 'http://', 0x04: 'https://', 0x05: 'tel:',
  0x06: 'mailto:', 0x07: 'ftp://anonymous:anonymous@', 0x08: 'ftp://ftp.',
  0x09: 'ftps://', 0x0A: 'sftp://', 0x0B: 'smb://', 0x0C: 'nfs://',
  0x0D: 'ftp://', 0x0E: 'dav://', 0x0F: 'news:', 0x10: 'telnet://',
  0x11: 'imap:', 0x12: 'rtsp://', 0x13: 'urn:', 0x14: 'pop:',
  0x15: 'sip:', 0x16: 'sips:', 0x17: 'tftp:', 0x18: 'btspp://',
  0x19: 'btl2cap://', 0x1A: 'btgoep://', 0x1B: 'tcpobex://',
  0x1C: 'irdaobex://', 0x1D: 'file://', 0x1E: 'urn:epc:id:',
  0x1F: 'urn:epc:tag:', 0x20: 'urn:epc:pat:', 0x21: 'urn:epc:raw:',
  0x22: 'urn:epc:', 0x23: 'urn:nfc:',
};

function decodeUrlRecord(data: DataView): string {
  const prefixCode = data.getUint8(0);
  const prefix = URI_PREFIXES[prefixCode];
  if (prefix !== undefined) {
    // Recognised NDEF URI prefix code — strip it and prepend the expanded prefix
    const rest = new TextDecoder().decode(
      new Uint8Array(data.buffer, data.byteOffset + 1, data.byteLength - 1)
    );
    return prefix + rest;
  }
  // No NDEF prefix byte — Chrome stored the full URL as raw UTF-8 bytes
  return new TextDecoder().decode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
}

function decodeTextRecord(data: DataView): string {
  const statusByte = data.getUint8(0);
  const langLength = statusByte & 0x3f;
  const isUtf16 = (statusByte & 0x80) !== 0;
  const textStart = 1 + langLength;
  const enc = isUtf16 ? 'utf-16' : 'utf-8';
  return new TextDecoder(enc).decode(
    new Uint8Array(data.buffer, data.byteOffset + textStart, data.byteLength - textStart)
  );
}

type TagRecord = { type: 'url' | 'text' | 'unknown'; content: string };
type ReadState = 'scanning' | 'success' | 'error';

type NfcReadPageProps = {
  onTagRead?: (payload: string) => void;
};

const NfcReadPage: React.FC<NfcReadPageProps> = ({ onTagRead }) => {
  const [readState, setReadState] = useState<ReadState>('scanning');
  const [records, setRecords] = useState<TagRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSheet, setShowSheet] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const isSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  useEffect(() => {
    if (!isSupported) {
      setErrorMessage('NFC reading requires Android with Chrome. Not supported on this device.');
      setReadState('error');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const ndef = new NDEFReader();

        ndef.addEventListener('reading', (event: NDEFReadingEvent) => {
          if (controller.signal.aborted) return;

          const parsed: TagRecord[] = event.message.records.map((record) => {
            if (record.recordType === 'url') {
              return { type: 'url', content: decodeUrlRecord(record.data) };
            } else if (record.recordType === 'text') {
              return { type: 'text', content: decodeTextRecord(record.data) };
            } else {
              return { type: 'unknown', content: `[${record.recordType}]` };
            }
          });

          setRecords(parsed);
          setReadState('success');
          setShowSheet(false);
          const primary = parsed[0]?.content;
          if (primary) onTagRead?.(primary);
        });

        ndef.addEventListener('readingerror', () => {
          if (controller.signal.aborted) return;
          setErrorMessage('Could not read NFC tag. Try holding the phone closer.');
          setReadState('error');
        });

        await ndef.scan({ signal: controller.signal });
      } catch (err) {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Failed to start NFC scan';
        setErrorMessage(msg);
        setReadState('error');
      }
    })();

    return () => {
      controller.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    abortRef.current?.abort();
    setShowSheet(false);
  };

  const handleRetry = () => {
    // Re-mount by navigating back — just close the sheet; parent handles back nav
    window.history.back();
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center gateway-enter">
      <div className="w-full max-w-md space-y-4">

        {/* Unsupported notice (shown above fold, not in sheet) */}
        {!isSupported && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>NFC reading requires Android with Chrome. Not supported on this device.</span>
          </div>
        )}

        {/* Results card */}
        {readState === 'success' && records.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-500 shrink-0" strokeWidth={1.5} />
              <h2 className="text-base font-semibold text-slate-900">Tag read successfully</h2>
            </div>
            {records.map((rec, i) => (
              <div key={i} className="pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  {rec.type === 'url' ? 'URL' : rec.type === 'text' ? 'Text' : 'Record'}
                </p>
                {rec.type === 'url' ? (
                  <a
                    href={rec.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-600 font-medium break-all hover:underline"
                  >
                    <span>{rec.content}</span>
                    <ExternalLink size={14} className="shrink-0" strokeWidth={1.5} />
                  </a>
                ) : (
                  <p className="text-slate-800 break-all">{rec.content}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Idle hint when sheet was closed but still scanning */}
        {readState === 'scanning' && !showSheet && (
          <p className="text-sm text-slate-400 text-center">Waiting for NFC tag...</p>
        )}
      </div>

      {/* Bottom sheet */}
      {showSheet && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" aria-hidden="true" />
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
              {readState === 'scanning' && (
                <>
                  <h3 className="text-3xl font-semibold text-slate-900 mb-6">Hold near the tag</h3>
                  <div className="w-28 h-28 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6 animate-pulse">
                    <Nfc size={64} strokeWidth={1.5} />
                  </div>
                  <p className="text-base text-slate-500 leading-relaxed max-w-[280px]">
                    Hold your phone near the NFC tag to read its contents.
                  </p>
                </>
              )}

              {readState === 'error' && (
                <>
                  <h3 className="text-3xl font-semibold text-slate-900 mb-6">Read failed</h3>
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
                    Go Back
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

export default NfcReadPage;
