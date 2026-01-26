export const getArtworkWatermarkedPublicUrl = (artworkId: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/watermarked_artworks/${artworkId}`;

