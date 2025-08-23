/**
 * HTTP Client
 * 
 * Handles all HTTP communication with StreamDeck Companion
 * including retry logic and error handling.
 */

import { StreamDeckError } from '../core/types.js';

export interface HttpClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  defaultHeaders: Record<string, string>;
}

export class HttpClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout;
    this.retries = config.retries;
    this.defaultHeaders = config.defaultHeaders;
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(
    method: 'GET' | 'POST',
    path: string,
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<any> {
    const url = new URL(path, this.baseUrl);
    
    // Add query parameters
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url.toString(), {
          method,
          headers: this.defaultHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Clone response to read body multiple times if needed
        const responseClone = response.clone();

        if (!response.ok) {
          const errorText = await responseClone.text().catch(() => null);
          throw new StreamDeckError(
            `HTTP ${response.status}: ${response.statusText}`,
            'HTTP_ERROR',
            response.status,
            errorText
          );
        }

        // Try to parse JSON response, but don't fail if it's not JSON
        try {
          return await response.json();
        } catch {
          // Use the cloned response for text parsing
          return await responseClone.text();
        }

      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    throw new StreamDeckError(
      `Failed after ${this.retries} attempts: ${lastError?.message}`,
      'REQUEST_FAILED',
      undefined,
      lastError
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<HttpClientConfig> {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retries: this.retries,
      defaultHeaders: { ...this.defaultHeaders }
    };
  }
}
