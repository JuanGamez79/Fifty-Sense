// src/api/axios.ts
// src/api/axios.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://192.168.1.11:3006';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    
    // Check if response is HTML (error page) instead of JSON
    if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
      throw new Error(`Server returned HTML instead of JSON. The backend may be down or misconfigured. Status: ${response.status}`);
    }

    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(result.message || `Request failed with status ${response.status}.`);
    }

    return result as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Server returned invalid JSON. The backend may be unreachable.');
    }
    throw error;
  }
}