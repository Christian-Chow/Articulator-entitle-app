/**
 * ArtworkVariants Component
 * 
 * A server component that displays all available derivative works (variants) of an artwork.
 * It fetches variants data from Supabase, filters out sold variants, and displays the 
 * remaining ones in a responsive grid layout. This component is integral to the artwork
 * detail page, showing users what derivative versions of the artwork are available.
 */

import { createClient } from "@/src/utils/supabase/server";
import ArtworkVariant from "@/src/components/Products/ArtworkVariant";
import { getTranslations } from "next-intl/server";

/**
 * Props for the ArtworkVariants component
 * @property {string} artworkId - The unique identifier of the parent artwork
 * @property {boolean} isOwner - Whether the current user owns this artwork
 */
interface ArtworkVariantsProps {
    artworkId: string
    isOwner: boolean
}

/**
 * ArtworkVariants Component
 * 
 * Displays a grid of available derivative works (variants) for a specific artwork.
 * Filters out variants that have already been sold and only shows variants with
 * valid preview images.
 * 
 * @param {ArtworkVariantsProps} props - Component props
 * @returns {Promise<JSX.Element|null>} The rendered grid of artwork variants or null if error occurs
 */
export default async function ArtworkVariants({ artworkId, isOwner }: ArtworkVariantsProps) {
    const t = await getTranslations();
    // Initialize Supabase client for data fetching
    const supabase = await createClient();
    
    // Optimize: Execute both queries in parallel instead of serially
    const [variants, soldVariantsResponse] = await Promise.all([
        // Fetch all variants for this artwork
        supabase.from("artwork_variants")
            .select("*")
            .eq("artwork_id", artworkId),
        // Get list of variants that have been sold
        supabase.from("variants_orders")
            .select("variant(id,artwork_id)")
            .eq("variant.artwork_id", artworkId)
    ]);

    // Extract variant IDs from sold variants response
    const soldVariants = (soldVariantsResponse.data || [])
        .filter(soldVariant => soldVariant["variant"] != null)
        .map(soldVariant => soldVariant["variant"]["id"])

    // Filter variants to only show available ones (not sold) with valid preview images
    const availableVariants = await Promise.all(
        (variants.data || [])
            .filter(variant => !soldVariants.includes(variant["id"]))
            .filter(variant => variant.preview_image !== null)
    );

    const soldVariantsData = await Promise.all(
        (variants.data || [])
            .filter(variant => soldVariants.includes(variant["id"]))
            .filter(variant => variant.preview_image !== null)
    );

    // Return null if variants data couldn't be loaded
    if (variants.error) return null;

    return (
        <div className="container py-8 mx-auto max-w-7xl">
            {/* Section heading with count of available variants */}
            <div className="flex justify-between items-center mb-6 text-3xl font-bold">
                {t('artworkDetail.derivativeWorks')} ({availableVariants.length} {t('artworkDetail.unit', { count: availableVariants.length })})
            </div>
            
            {/* Responsive grid layout for variant cards */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3 lg:mt-12 lg:grid-cols-5">
                {availableVariants.map((variant, key) => (
                    <ArtworkVariant 
                        key={key} 
                        data={variant} 
                        isMyArtwork={isOwner} 
                        sold={false}
                    />
                ))}
            </div>
            <div className="flex justify-between items-center mb-6 text-3xl font-bold mt-10">
                {t('artworkDetail.derivativeTotal')} {soldVariantsData.length + availableVariants.length} {t('artworkDetail.unit', { count: soldVariantsData.length + availableVariants.length })}
            </div>
            
            {/* Responsive grid layout for variant cards */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3 lg:mt-12 lg:grid-cols-5">
                {soldVariantsData.map((variant, key) => (
                    <ArtworkVariant 
                        key={key} 
                        data={variant} 
                        isMyArtwork={isOwner} 
                        sold={true}
                    />
                ))}
            </div>
        </div>
    )
}