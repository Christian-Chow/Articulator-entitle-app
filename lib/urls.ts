export const getArtworkWatermarkedPublicUrl = (artworkId: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/watermarked_artworks/${artworkId}`;

// Get backend URL - use environment variable if set, otherwise detect from current hostname
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use same origin (hostname + port 3001) or env variable
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If served over HTTPS on a production domain (not localhost), use same origin
    // This assumes reverse proxy routes /api/* to backend on port 3001
    // This avoids SSL protocol errors when backend is HTTP-only
    if (protocol === 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Use same origin (no port) - reverse proxy should route /api/* to backend
      // Never add port 3001 when on HTTPS production domain
      return `${protocol}//${hostname}`;
    }
    
    // For HTTP (development) or localhost, use port 3001
    return `${protocol}//${hostname}:3001`;
  }
  // Server-side: use env variable or default to localhost
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
};

export const BACKEND_API_URL = getBackendUrl();

