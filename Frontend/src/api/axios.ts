<<<<<<< Updated upstream
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3006';
// Base API client. All requests go through apiRequest which handles
// headers, auth tokens, JSON parsing, and errors in one place.
=======
// src/api/axios.ts
// src/api/axios.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3006';
>>>>>>> Stashed changes

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

// Sends an HTTP request to the backend. Attaches the auth token if provided.
// Throws an error with the server's message if the request fails.
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

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Safely parse — server may return an empty body on some errors
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(result.message || `Request failed with status ${response.status}.`);
  }

  return result as T;
}