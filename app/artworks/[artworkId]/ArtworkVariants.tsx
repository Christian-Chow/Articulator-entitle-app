'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getArtworkWatermarkedPublicUrl } from '@/lib/urls';

type ArtworkVariant = {
  id: string;
  artwork_id: string;
  preview_image: string | null;
  style_name?: string | null;
  styleName?: string | null;
  [key: string]: any;
};

interface ArtworkVariantsProps {
  artworkId: string;
}

export default function ArtworkVariants({ artworkId }: ArtworkVariantsProps) {
  const [availableVariants, setAvailableVariants] = useState<ArtworkVariant[]>([]);
  const [soldVariants, setSoldVariants] = useState<ArtworkVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artworkId) return;

    const loadVariants = async () => {
      setLoading(true);
      try {
        // Fetch all variants and sold variants in parallel
        const [variantsResponse, soldVariantsResponse] = await Promise.all([
          supabase
            .from('artwork_variants')
            .select('*')
            .eq('artwork_id', artworkId),
          supabase
            .from('variants_orders')
            .select('variant(id,artwork_id)')
            .eq('variant.artwork_id', artworkId),
        ]);

        if (variantsResponse.error) {
          console.error('Error loading variants', variantsResponse.error);
          return;
        }

        // Extract sold variant IDs
        const soldVariantIds = (soldVariantsResponse.data || [])
          .filter((item: any) => item.variant != null)
          .map((item: any) => item.variant.id);

        // Filter variants
        const allVariants = (variantsResponse.data || []) as ArtworkVariant[];
        const available = allVariants.filter(
          (variant) => !soldVariantIds.includes(variant.id) && variant.preview_image !== null
        );
        const sold = allVariants.filter(
          (variant) => soldVariantIds.includes(variant.id) && variant.preview_image !== null
        );

        setAvailableVariants(available);
        setSoldVariants(sold);
      } catch (err: any) {
        console.error('Error loading variants', err);
      } finally {
        setLoading(false);
      }
    };

    loadVariants();
  }, [artworkId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
        Loading derivatives...
      </div>
    );
  }

  const totalVariants = availableVariants.length + soldVariants.length;

  if (totalVariants === 0) {
    return null;
  }

  return (
    <section className="space-y-6 mt-8">
      {/* Available Variants Section */}
      {availableVariants.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
              Derivative Works
            </h2>
            <p className="text-[10px] text-slate-500">
              {availableVariants.length} {availableVariants.length === 1 ? 'variant' : 'variants'} available
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {availableVariants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} sold={false} />
            ))}
          </div>
        </div>
      )}

      {/* Sold Variants Section */}
      {soldVariants.length > 0 && (
        <div>
          <div className="mb-4 pt-6 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
              Total Derivatives
            </h2>
            <p className="text-[10px] text-slate-500">
              {totalVariants} {totalVariants === 1 ? 'variant' : 'variants'} total
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {soldVariants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} sold={true} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

interface VariantCardProps {
  variant: ArtworkVariant;
  sold: boolean;
}

function VariantCard({ variant, sold }: VariantCardProps) {
  // Handle preview_image - it might be a full URL or a storage path
  const getImageUrl = () => {
    if (!variant.preview_image) return '/auth_banner-min.png';
    
    // If it's already a full URL, use it directly
    if (variant.preview_image.startsWith('http://') || variant.preview_image.startsWith('https://')) {
      return variant.preview_image;
    }
    
    // Otherwise, construct the URL using the same pattern as main images
    return getArtworkWatermarkedPublicUrl(variant.preview_image);
  };

  const imageUrl = getImageUrl();
  
  // Get style name - check both possible field names
  const rawStyleName = variant.style_name || variant.styleName || null;
  
  // Format style name: remove "sai-" prefix, capitalize, and replace "-" with spaces
  const formatStyleName = (name: string | null): string | null => {
    if (!name) return null;
    
    // Remove "sai-" prefix (case insensitive)
    let formatted = name.replace(/^sai-/i, '');
    
    // Replace "-" with spaces
    formatted = formatted.replace(/-/g, ' ');
    
    // Capitalize first letter of each word
    formatted = formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return formatted;
  };
  
  const styleName = formatStyleName(rawStyleName);

  return (
    <div className="rounded-[2rem] overflow-hidden bg-white border border-slate-100 shadow-sm relative">
      <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
        <img
          src={imageUrl}
          alt={`Variant ${variant.id}`}
          className="w-full h-full object-cover"
        />
        {sold && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full">
              Sold
            </span>
          </div>
        )}
      </div>
      {styleName && (
        <div className="p-3 pt-2">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium mb-0.5">
            Style
          </p>
          <p className="text-xs text-slate-700 font-medium truncate">
            {styleName}
          </p>
        </div>
      )}
    </div>
  );
}
