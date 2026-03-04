'use client'

import React, { useState, useEffect } from 'react';
import { Image, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getArtworkWatermarkedPublicUrl } from '@/lib/urls';

type Artwork = {
  id: string;
  title: string | null;
  description: string | null;
  main_image: string | null;
  created_at: string | null;
};

type AlbumPageProps = {
  user: User | null;
  onArtworkClick?: (artworkId: string) => void;
};

const AlbumPage: React.FC<AlbumPageProps> = ({ user, onArtworkClick }) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtworks = async () => {
      if (!user?.id) {
        setArtworks([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('artworks')
          .select('id, title, description, main_image, created_at')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching artworks:', fetchError);
          setError('Failed to load your artworks.');
        } else {
          setArtworks(data || []);
        }
      } catch (err) {
        console.error('Error fetching artworks:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="gateway-enter py-16 text-center">
        <div className="bg-slate-50 rounded-3xl p-8 mx-auto max-w-xs">
          <Image size={40} className="text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-500">Please log in to view your album.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gateway-enter flex items-center justify-center py-20">
        <Loader2 size={28} className="text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="gateway-enter py-10 px-2">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="gateway-enter py-16 text-center">
        <div className="bg-slate-50 rounded-3xl p-8 mx-auto max-w-xs">
          <Image size={40} className="text-slate-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-500 mb-1">No artworks yet</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Your uploaded artworks will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gateway-enter">
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-2 mb-4">
        {artworks.length} {artworks.length === 1 ? 'Artwork' : 'Artworks'}
      </p>

      <div className="space-y-3">
        {artworks.map((artwork) => {
          const imageUrl = artwork.main_image
            ? getArtworkWatermarkedPublicUrl(artwork.main_image)
            : null;

          return (
            <button
              key={artwork.id}
              onClick={() => onArtworkClick?.(artwork.id)}
              className="w-full bg-white border border-slate-100 rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.99] text-left group flex"
            >
              <div className="w-24 h-24 shrink-0 bg-slate-100 overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={artwork.title || 'Artwork'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={28} className="text-slate-300" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-3 pr-4 pl-3 flex flex-col justify-center">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {artwork.title || 'Untitled'}
                </p>
                {artwork.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {artwork.description}
                  </p>
                )}
                {artwork.created_at && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(artwork.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AlbumPage;
