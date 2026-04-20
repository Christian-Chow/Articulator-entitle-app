'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Nfc, X, CheckCircle, AlertTriangle, ImageIcon, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getArtworkWatermarkedPublicUrl } from '@/lib/urls';

// Minimal Web NFC API type declarations
interface NDEFRecordInit { recordType: string; data: string; }
interface NDEFMessageInit { records: NDEFRecordInit[]; }
interface NDEFReaderInstance {
  write(message: NDEFMessageInit, options?: { signal?: AbortSignal }): Promise<void>;
}
declare const NDEFReader: { new(): NDEFReaderInstance };

type Artwork = {
  id: string;
  title: string | null;
  main_image: string | null;
};

type WriteState = 'waiting' | 'success' | 'error';

type NfcEncodePageProps = {
  user: User | null;
};

const COA_BASE = 'https://basel.articulator.ai/artworks';

const NfcEncodePage: React.FC<NfcEncodePageProps> = ({ user }) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [writeState, setWriteState] = useState<WriteState>('waiting');
  const [errorMessage, setErrorMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const isSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  useEffect(() => {
    const fetchArtworks = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('artworks')
          .select('id, title, main_image')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setArtworks(data || []);
      } catch {
        setFetchError('Failed to load your artworks.');
      } finally {
        setLoading(false);
      }
    };
    fetchArtworks();
  }, [user?.id]);

  // Abort write on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleArtworkSelect = async (artwork: Artwork) => {
    abortRef.current?.abort();
    setSelectedArtwork(artwork);
    setWriteState('waiting');
    setErrorMessage('');
    setShowSheet(true);

    if (!isSupported) {
      setErrorMessage('NFC writing requires Android with Chrome. Not supported on this device.');
      setWriteState('error');
      return;
    }

    const url = `${COA_BASE}/${artwork.id}/coa`;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const ndef = new NDEFReader();
      await ndef.write(
        { records: [{ recordType: 'url', data: url }] },
        { signal: controller.signal }
      );
      if (!controller.signal.aborted) setWriteState('success');
    } catch (err) {
      if (controller.signal.aborted) return;
      setErrorMessage(err instanceof Error ? err.message : 'Write failed');
      setWriteState('error');
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setShowSheet(false);
    setSelectedArtwork(null);
  };

  const handleRetry = () => {
    setShowSheet(false);
    setSelectedArtwork(null);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center">
        <Loader2 size={28} className="text-slate-400 animate-spin" />
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center">
        <div className="bg-slate-50 rounded-3xl p-8 max-w-xs text-center">
          <ImageIcon size={40} className="text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-500">Please log in to encode artworks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-14rem)]">

      {/* Unsupported device notice */}
      {!isSupported && (
        <div className="flex items-start gap-3 px-4 py-3 mb-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" strokeWidth={1.5} />
          <span>NFC writing requires Android with Chrome. Not supported on this device.</span>
        </div>
      )}

      {/* Fetch error */}
      {fetchError && (
        <div className="px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* Instructions */}
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-2 mb-4">
        Choose artwork to encode
      </p>

      {/* Empty state */}
      {artworks.length === 0 && !fetchError && (
        <div className="py-16 text-center">
          <div className="bg-slate-50 rounded-3xl p-8 mx-auto max-w-xs">
            <ImageIcon size={40} className="text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-500">No artworks yet</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              Upload artworks first to encode them
            </p>
          </div>
        </div>
      )}

      {/* Artwork list */}
      <div className="space-y-3">
        {artworks.map((artwork) => {
          const imageUrl = artwork.main_image
            ? getArtworkWatermarkedPublicUrl(artwork.main_image)
            : null;
          return (
            <button
              key={artwork.id}
              onClick={() => handleArtworkSelect(artwork)}
              className="w-full bg-white border border-slate-100 rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.99] text-left group flex"
            >
              <div className="w-20 h-20 shrink-0 bg-slate-100 overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={artwork.title || 'Artwork'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={24} className="text-slate-300" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-3 pr-4 pl-3 flex flex-col justify-center">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {artwork.title || 'Untitled'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {`${COA_BASE}/${artwork.id}/coa`}
                </p>
              </div>
              <div className="flex items-center pr-4">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Nfc size={16} className="text-emerald-600" strokeWidth={1.5} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom sheet */}
      {showSheet && selectedArtwork && (
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
                  <h3 className="text-3xl font-semibold text-slate-900 mb-2">Ready to encode</h3>
                  <p className="text-sm text-slate-500 mb-6 truncate max-w-[280px]">
                    {selectedArtwork.title || 'Untitled'}
                  </p>
                  <div className="w-28 h-28 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6 animate-pulse">
                    <Nfc size={64} strokeWidth={1.5} />
                  </div>
                  <p className="text-base text-slate-500 leading-relaxed max-w-[280px]">
                    Hold your phone near the NFC tag to write the COA link
                  </p>
                </>
              )}

              {writeState === 'success' && (
                <>
                  <h3 className="text-3xl font-semibold text-slate-900 mb-2">Tag written!</h3>
                  <p className="text-sm text-slate-500 mb-6 truncate max-w-[280px]">
                    {selectedArtwork.title || 'Untitled'}
                  </p>
                  <div className="w-28 h-28 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6">
                    <CheckCircle size={64} strokeWidth={1.5} />
                  </div>
                  <p className="text-base text-slate-500 leading-relaxed max-w-[280px] mb-8">
                    The COA link was written to the tag successfully.
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
