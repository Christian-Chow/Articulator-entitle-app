export const getArtworkWatermarkedPublicUrl = (artworkId: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/watermarked_artworks/${artworkId}`;

export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

