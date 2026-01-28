import { BACKEND_API_URL } from './urls';

export interface DecodeResponse {
  decodedMessage?: string;
  error?: string;
  details?: string;
}

export const decodeImage = async (imageFile: File): Promise<DecodeResponse> => {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/decode`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error || 'Failed to decode image', details: errorData.details };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return { 
      error: 'Network error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
