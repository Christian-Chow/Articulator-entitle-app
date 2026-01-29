export const getArtworkWatermarkedPublicUrl = (artworkId: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/watermarked_artworks/${artworkId}`;

// Get backend URL - use environment variable if set, otherwise detect from current hostname
const getBackendUrl = () => {
  // Support both NEXT_PUBLIC_BACKEND_URL and NEXT_PUBLIC_PICODE_API_URL for backwards compatibility
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_PICODE_API_URL;
  
  if (typeof window !== 'undefined') {
    // Client-side: use same origin (hostname + port 3001) or env variable
    if (backendUrl) {
      return backendUrl;
    }
    // Use same hostname but port 3001
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:3001`;
  }
  // Server-side: use env variable or default to localhost
  return backendUrl || 'http://localhost:3001';
};

export const BACKEND_API_URL = getBackendUrl();

