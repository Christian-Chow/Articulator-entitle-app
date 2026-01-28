/**
 * Extracts artwork ID from a decoded message
 * Handles various formats:
 * - Full URL: https://articulator-develop.vercel.app/artworks/0d439be8-8f6d-4b11-82bf-06f3eb15160c
 * - Localhost URL: http://localhost:3000/artworks/c10193cd-938a-49a9-8115-c9f2a1901e69
 * - Just the ID: 0d439be8-8f6d-4b11-82bf-06f3eb15160c
 */
export const extractArtworkId = (decodedMessage: string): string | null => {
  if (!decodedMessage) return null;

  // Trim whitespace
  const trimmed = decodedMessage.trim();

  // UUID regex pattern (matches standard UUID format)
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  // Try to extract from URL pattern first
  const urlMatch = trimmed.match(/\/artworks\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Try to match UUID directly
  const uuidMatch = trimmed.match(uuidPattern);
  if (uuidMatch && uuidMatch[0]) {
    return uuidMatch[0];
  }

  return null;
};
