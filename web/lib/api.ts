// API client
const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const resolveApiBases = () => {
  const envBase = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  const fallbackFly = 'https://orbitalastro-api.fly.dev';

  if (envBase) {
    const primary = stripTrailingSlashes(envBase);
    const fallback = primary === 'https://api.orbitalastro.ca' ? fallbackFly : undefined;
    return { primary, fallback };
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return { primary: 'http://127.0.0.1:8000' };
    }

    if (hostname === 'www.orbitalastro.ca' || hostname === 'orbitalastro.ca') {
      return { primary: 'https://api.orbitalastro.ca', fallback: fallbackFly };
    }

    if (hostname.endsWith('.fly.dev')) {
      return { primary: fallbackFly };
    }
  }

  return { primary: 'http://127.0.0.1:8000' };
};

const { primary: API_BASE, fallback: API_FALLBACK } = resolveApiBases();
const VERCEL_BYPASS_TOKEN = process.env.NEXT_PUBLIC_VERCEL_BYPASS_TOKEN || '8tPx2wLmV7H9rQ4sK1dJ0aYbU3zN5eTf';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

interface TransitData {
  transits?: Array<{
    aspect?: string;
    transiting_body?: string;
    natal_body?: string;
    angle?: string;
  }>;
  transits_to_angles?: Array<{
    aspect?: string;
    transiting_body?: string;
    angle?: string;
  }>;
}

class ApiClient {
  private baseUrl: string;
  private fallbackUrl?: string;

  private getHeaders(baseUrl: string): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    // Add Vercel bypass headers if the API URL is a Vercel deployment
    if (baseUrl.includes('vercel.app')) {
      headers['x-vercel-set-bypass-cookie'] = 'true';
      headers['x-vercel-protection-bypass'] = VERCEL_BYPASS_TOKEN;
    }
    return headers;
  }

  constructor(baseUrl: string, fallbackUrl?: string) {
    this.baseUrl = baseUrl;
    this.fallbackUrl = fallbackUrl;
  }

  private async fetchWithFallback(url: string, init: RequestInit, fallbackUrl?: string): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isNetworkError =
        error instanceof TypeError ||
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('ENOTFOUND') ||
        message.includes('getaddrinfo');

      if (!fallbackUrl || !isNetworkError) throw error;

      const fallbackRequestUrl = fallbackUrl + url.slice(this.baseUrl.length);
      const response = await fetch(fallbackRequestUrl, init);
      this.baseUrl = fallbackUrl;
      this.fallbackUrl = undefined;
      return response;
    }
  }

  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = this.getHeaders(this.baseUrl);
      delete (headers as Record<string, string>)['Content-Type']; // GET doesn't need Content-Type
      
      // For Vercel deployments, add bypass parameters to URL
      let url = `${this.baseUrl}${endpoint}`;
      if (this.baseUrl.includes('vercel.app')) {
        const separator = endpoint.includes('?') ? '&' : '?';
        url += `${separator}x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${VERCEL_BYPASS_TOKEN}`;
      }
      
      const response = await this.fetchWithFallback(url, { headers }, this.fallbackUrl);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use the status text
        }
        return { error: errorMessage };
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async post<T = unknown>(endpoint: string, body: unknown, timeout?: number): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${endpoint}`;
    try {
      // For Vercel deployments, add bypass parameters to URL as well as headers
      const headers = this.getHeaders(this.baseUrl);
      
      // Add bypass token to URL if it's a Vercel deployment (Vercel accepts both headers and query params)
      if (this.baseUrl.includes('vercel.app')) {
        const separator = endpoint.includes('?') ? '&' : '?';
        url += `${separator}x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${VERCEL_BYPASS_TOKEN}`;
      }
      
      // Use longer timeout for AI endpoints (120 seconds)
      const requestTimeout = timeout || (endpoint.includes('/ai/') ? 120000 : 30000);
      
      console.log('[API Client] Fetching:', { method: 'POST', url, headers: Object.keys(headers), bodySize: JSON.stringify(body).length, timeout: requestTimeout });
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeout);
      
      try {
        const response = await this.fetchWithFallback(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
          signal: controller.signal
        }, this.fallbackUrl);
        clearTimeout(timeoutId);
      console.log('[API Client] Fetch response:', { status: response.status, statusText: response.statusText, ok: response.ok });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use the status text
        }
        return { error: errorMessage };
      }
      
      const data = await response.json();
      console.log('[API Client] Response received:', { status: response.status, url, dataKeys: Object.keys(data || {}) });
      return { data };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[API Client] Request failed:', { url, error: errorMessage });
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return { 
          error: `Cannot connect to backend API at ${this.baseUrl}. Make sure the backend server is running. For local development, start it with: .\\.venv\\Scripts\\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 (Windows) or python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 (macOS/Linux).` 
        };
      }
      
      return { error: errorMessage };
    }
  }

  // API endpoints
  natal = {
    calculate: async (body: unknown): Promise<ApiResponse> => {
      console.log('[API Client] Sending natal request to:', `${this.baseUrl}/natal`);
      return this.post('/natal', body);
    }
  };

  transits = {
    calculate: async (body: unknown): Promise<ApiResponse<TransitData>> => {
      return this.post<TransitData>('/api/transits', body);
    }
  };

  progressions = {
    calculate: async (body: unknown): Promise<ApiResponse> => {
      return this.post('/progressions', body);
    }
  };

  solar_returns = {
    calculate: async (body: unknown): Promise<ApiResponse> => {
      return this.post('/solar-returns', body);
    }
  };

  rectification = {
    calculate: async (body: unknown): Promise<ApiResponse> => {
      return this.post('/rectification', body);
    }
  };

  ai = {
    interpret: async (prompt: string, systemInstruction?: string): Promise<ApiResponse<{ content: string }>> => {
      return this.post<{ content: string }>('/ai/interpret', {
        prompt,
        system_instruction: systemInstruction
      });
    }
  };
}

export const apiClient = new ApiClient(API_BASE, API_FALLBACK);

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE}${endpoint}`);
    return response.json();
  },
  post: async (endpoint: string, data: unknown) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

export type { TransitData, ApiResponse };
