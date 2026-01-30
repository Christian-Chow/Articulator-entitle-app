'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import MenuOption from '@/components/pages/MenuOption';

type Artwork = {
  id: string;
  title: string | null;
};

export default function ArtworkMenuPage() {
  const params = useParams<{ artworkId: string }>();
  const router = useRouter();
  const artworkId = params.artworkId;

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!artworkId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch auth session
        const [{ data: sessionData }, { data: artworkData }] = await Promise.all([
          supabase.auth.getSession(),
          supabase
            .from('artworks')
            .select('id,title')
            .eq('id', artworkId)
            .single(),
        ]);

        if (sessionData.session) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }

        if (artworkData) {
          setArtwork(artworkData as Artwork);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [artworkId]);

  const headerSubtitle = 'Artwork Menu';
  const headerTitle = artwork?.title || 'Artwork';

  if (loading && !artwork) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 overflow-x-hidden pb-10">
      <Header
        subtitle={headerSubtitle}
        title={headerTitle}
        isLoggedIn={isLoggedIn}
        onLoginToggle={() => {}}
        onLogoClick={() => router.push('/')}
        isAuthView={false}
        onBack={() => router.back()}
      />

      <main className="px-6">
        <MenuOption isLoggedIn={isLoggedIn} />
      </main>
    </div>
  );
}

