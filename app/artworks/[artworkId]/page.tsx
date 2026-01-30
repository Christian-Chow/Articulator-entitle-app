'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { getArtworkWatermarkedPublicUrl } from '@/lib/urls';
import MenuOption from '@/components/pages/MenuOption';

type Artwork = {
  id: string;
  title: string | null;
  description: string | null;
  main_image_url?: string | null;
  main_image?: string | null;
};

export default function ArtworkDetailPage() {
  const params = useParams<{ artworkId: string }>();
  const router = useRouter();
  const artworkId = params.artworkId;

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!artworkId) return;

    const loadArtwork = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch auth session and artwork in parallel
        const [{ data: sessionData }, { data: artworkData, error: artworkError }] = await Promise.all([
          supabase.auth.getSession(),
          supabase
            .from('artworks')
            .select('*')
            .eq('id', artworkId)
            .single(),
        ]);

        if (sessionData.session) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }

        if (artworkError) {
          throw artworkError;
        }

        setArtwork(artworkData as Artwork);
      } catch (err: any) {
        console.error('Error loading artwork', err);
        setError('Unable to load artwork details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadArtwork();
  }, [artworkId]);

  const imageUrl = artwork?.main_image
    ? getArtworkWatermarkedPublicUrl(artwork.main_image)
    : '/auth_banner-min.png';

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 overflow-x-hidden">
      <Header
        subtitle="Artwork Detail"
        title={artwork?.title || 'Artwork'}
        isLoggedIn={isLoggedIn}
        onLoginToggle={() => {}}
        onLogoClick={() => router.push('/')}
        isAuthView={false}
        onBack={() => router.back()}
      />

      <main className="px-6 pb-10">
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            Loading artwork...
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && artwork && (
          <div className="space-y-8">
            <div className="rounded-[2.5rem] overflow-hidden bg-white border border-slate-100 shadow-sm">
              <div className="aspect-square w-full bg-slate-100 overflow-hidden">
                <img
                  src={imageUrl || ''}
                  alt={artwork.title || 'Artwork image'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <section className="space-y-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Description
                </h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  {artwork.description || 'No description available for this artwork yet.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium mb-2">
                  Artwork ID
                </p>
                <p className="text-[11px] text-slate-500 break-all">
                  {artwork.id}
                </p>
              </div>
            </section>

            {/* Artwork Tools Menu */}
            <div className="pt-4">
              <MenuOption isLoggedIn={isLoggedIn} />
            </div>
          </div>
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

