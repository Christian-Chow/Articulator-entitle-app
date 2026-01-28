/**
 * Artwork Detail Page
 * 
 * This server component displays detailed information about a specific artwork.
 * It fetches artwork data from Supabase and renders a comprehensive view including
 * the artwork image, description, and ownership details. It also includes components
 * for artwork variants, remixing options, and social sharing functionality.
 * 
 * Route: /artworks/[artworkId]
 */

import ArtworkVariants from './ArtworkVariants'
import RemixArtworkCard from './RemixArtworkCard'
import { isMyArtwork } from '@/src/queries/artwork'
import DeleteArtworkButton from './DeleteArtworkButton'
import { createClient } from '@/src/utils/supabase/server'
import ImageDialog from './ImageDialog'
import { getArtworkWatermarkedPublicUrl } from '@/src/lib/urls'
import SocialShare from './SocialShare'
import QRCode from '@/src/components/QRCode/qrcode'
import C2paDisplay from '@/src/components/Products/C2paDisplay'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Edit } from 'lucide-react'

/**
 * Props for the artwork detail page
 * @property {Object} params - Route parameters
 * @property {string} params.artworkId - The unique identifier for the artwork
 */
interface PageProps {
    params: Promise<{
        artworkId: string
    }>
}

/**
 * Set maximum duration for server-side rendering before timing out
 * Prevents excessive waiting times for users if data fetching is slow
 */
export const maxDuration = 300;

/**
 * Artwork Detail Page Component
 * 
 * Displays comprehensive information about a specific artwork, including
 * its image, description, and actions like sharing or deleting (for owners).
 * Also shows related artwork variants and remix options.
 * 
 * @param {PageProps} props - Component props containing the artworkId
 * @returns {Promise<JSX.Element|null>} The rendered artwork detail page or null if artwork not found
 */
const Page = async ({ params }: PageProps) => {

    const { artworkId } = await params
    // Initialize translation function and Supabase client for data fetching
    const t = await getTranslations();
    const supabase = await createClient();

    // Optimize: Execute all queries in parallel instead of serially
    const [
        { data: user },
        artwork
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("artworks").select("*,owner_id(id, username)").eq("id", artworkId).eq("approved_for_sale", "verified")
    ]);

    // Return null if artwork not found or error occurs
    if (artwork.error || !artwork.data?.[0]) return null;

    // Check ownership efficiently using the fetched data
    const isOwner = Boolean(user?.user && artwork.data[0].owner_id.id === user.user.id);

    return (
        <div className='bg-white'>
            <div className='container px-4 mx-auto py-25'>
                <div className='grid grid-cols-12 md:gap-8'>
                    {/* Left side - Artwork Image */}
                    <div className='space-y-6 col-span-12 md:col-span-5'>
                        <div className='rounded-lg aspect-square relative'>
                            <ImageDialog 
                                urls={[getArtworkWatermarkedPublicUrl(artwork.data[0].main_image)]}
                                alt={artwork.data[0].title || 'Artwork image'}
                            />
                            {/* <C2paDisplay imageUrl={getArtworkWatermarkedPublicUrl(artwork.data[0].main_image)} /> */}
                        </div>

                        {/* Commented out section for additional artwork metadata
                            This section would display the artwork title, ID, and artist link */}

                    </div>

                    {/* Right side - Artwork Details */}
                    <div className='space-y-6 col-span-12 md:col-span-7 flex justify-center flex-col'>
                        {/* Commented out sections for:
                            - Artist's signature
                            - Price and purchase actions
                            - View and purchase statistics */}
                        <div className='py-4'>
                            <p className='text-4xl font-bold'>{artwork.data[0].title}</p>
                        </div>

                        {/* Description section */}
                        <div className='border-t pt-6'>
                            {/* <h3 className='text-sm font-medium mb-2'>Description</h3> */}
                            <p className='text-sm text-muted-foreground'>
                                {artwork.data[0].description}
                            </p>
                        </div>

                        {/* Social sharing functionality */}
                        <div className='border-t pt-6 flex flex-row'>
                            <SocialShare
                                url={`${process.env.NEXT_PUBLIC_APP_URL}/artworks/${artworkId}`}
                                title={artwork.data[0].title || t('artworkDetail.socialShare.defaultTitle')}
                                description={artwork.data[0].description || t('artworkDetail.socialShare.defaultDescription')}
                            />
                            <div className='self-center px-2'>
                                <QRCode
                                    link={`${process.env.NEXT_PUBLIC_APP_URL}/artworks/${artworkId}`}
                                    artworkId={artworkId}
                                />
                            </div>
                        </div>

                        {/* Commented out section for original piece details
                            This would show additional metadata about the original artwork */}

                        {/* Edit and Delete buttons - Only shown to artwork owner */}
                        {isOwner && (
                            <div className='pt-4 flex gap-2'>
                                <Button asChild variant="outline">
                                    <Link href={`/edit-artwork/${artworkId}`}>
                                        <Edit className="mr-2 w-4 h-4" />
                                        {t('artworkDetail.editButton')}
                                    </Link>
                                </Button>
                                <DeleteArtworkButton artworkId={artworkId} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Related artwork components */}
                <div className='mt-4'>
                    {/* Component for creating remixed versions of this artwork */}
                    {isOwner && (
                        <RemixArtworkCard artworkId={artworkId} />
                    )}
                    {/* Component showing different variants of this artwork */}
                    <ArtworkVariants artworkId={artworkId} isOwner={isOwner} />
                </div>
            </div>
        </div>
    )
}

export default Page
