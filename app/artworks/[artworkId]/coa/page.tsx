'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

const ArtworkCoaPreview = dynamic(
  () => import('@/components/coa/ArtworkCoaPreview'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading certificate...
      </div>
    ),
  },
);

export default function ArtworkCoaPage() {
  const params = useParams<{ artworkId: string }>();
  const router = useRouter();
  const artworkId = params.artworkId;

  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!artworkId) return;

    const loadArtwork = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: sessionData }, { data: artworkData, error: artworkError }] = await Promise.all([
          supabase.auth.getSession(),
          supabase
            .from('artworks')
            .select('*,owner_id(id, username)')
            .eq('id', artworkId)
            .single(),
        ]);

        setIsLoggedIn(Boolean(sessionData.session));

        if (artworkError) {
          throw artworkError;
        }

        setArtwork(artworkData);
      } catch (err: any) {
        console.error('Error loading artwork for COA', err);
        setError('Unable to load certificate. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadArtwork();
  }, [artworkId]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 overflow-x-hidden pb-10">
      <Header
        subtitle="Certificate"
        title={artwork?.title || 'Artwork'}
        isLoggedIn={isLoggedIn}
        onLoginToggle={() => {}}
        onLogoClick={() => router.push('/')}
        isAuthView={false}
        onBack={() => router.back()}
      />

      <main className="px-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            Loading certificate...
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && artwork && (
          <ArtworkCoaPreview artwork={artwork} />
        )}

        {!loading && !error && !artwork && (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            Artwork not found.
          </div>
        )}
      </main>
    </div>
  );
}
