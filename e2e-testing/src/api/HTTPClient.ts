import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APITestConfig, APIResponse, APITestError } from './types';
import { getLogger } from '../utils/logger';

// Extend axios config to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

export class HTTPClient {
  private client: AxiosInstance;
  private config: APITestConfig;
  private logger = getLogger();

  constructor(config: APITestConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...config.defaultHeaders,
      },
    });

    this.setupInterceptors();
    this.setupAuthentication();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        config.metadata = { startTime };
        this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });
        return config;
      },
      (error) => {
        this.logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and timing
    this.client.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const startTime = response.config.metadata?.startTime || endTime;
        const responseTime = endTime - startTime;
        
        this.logger.debug(`API Response: ${response.status} ${response.statusText}`, {
          responseTime: `${responseTime}ms`,
          data: response.data,
        });
        
        return response;
      },
      (error) => {
        const endTime = Date.now();
        const startTime = error.config?.metadata?.startTime || endTime;
        const responseTime = endTime - startTime;
        
        this.logger.error('API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseTime: `${responseTime}ms`,
          data: error.response?.data,
          message: error.message,
        });
        
        return Promise.reject(error);
      }
    );
  }

  private setupAuthentication(): void {
    if (!this.config.authentication) return;

    const { type, token, username, password, headers } = this.config.authentication;

    switch (type) {
      case 'bearer':
        if (token) {
          this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        break;
      case 'basic':
        if (username && password) {
          const credentials = Buffer.from(`${username}:${password}`).toString('base64');
          this.client.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'custom':
        if (headers) {
          Object.assign(this.client.defaults.headers.common, headers);
        }
        break;
    }
  }

  async get<T = any>(
    path: string,
    params?: Record<string, any>,
    options?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    return this.makeRequest('GET', path, undefined, params, options);
  }

  async post<T = any>(
    path: string,
    data?: any,
    params?: Record<string, any>,
    options?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    return this.makeRequest('POST', path, data, params, options);
  }

  async put<T = any>(
    path: string,
    data?: any,
    params?: Record<string, any>,
    options?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    return this.makeRequest('PUT', path, data, params, options);
  }

  async delete<T = any>(
    path: string,
    params?: Record<string, any>,
    options?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    return this.makeRequest('DELETE', path, undefined, params, options);
  }

  async patch<T = any>(
    path: string,
    data?: any,
    params?: Record<string, any>,
    options?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    return this.makeRequest('PATCH', path, data, params, options);
  }

  private async makeRequest<T = any>(
    method: string,
    path: string,
    data?: any,
    params?: Record<string, any>,
    options?: AxiosRequestConfig
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: any;

    while (attempt <= this.config.retryAttempts) {
      try {
        const config: AxiosRequestConfig = {
          method: method.toLowerCase() as any,
          url: path,
          data,
          params,
          ...options,
        };

        const response: AxiosResponse<T> = await this.client.request(config);
        const endTime = Date.now();

        return {
          status: response.status,
          statusText: response.statusText,
          headers: this.normalizeHeaders(response.headers),
          data: response.data,
          responseTime: endTime - startTime,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        lastError = error;
        attempt++;

        const apiError = this.createAPIError(error);
        
        // Don't retry if it's not a retryable error
        if (!apiError.retryable || attempt > this.config.retryAttempts) {
          throw apiError;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        this.logger.warn(`API request failed, retrying in ${delay}ms (attempt ${attempt}/${this.config.retryAttempts})`);
        await this.sleep(delay);
      }
    }

    throw this.createAPIError(lastError);
  }

  private createAPIError(error: any): APITestError {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'Request timeout',
        details: error.message,
        retryable: true,
      };
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        type: 'network',
        message: 'Network connection failed',
        details: error.message,
        retryable: true,
      };
    }

    if (error.response) {
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        return {
          type: 'authentication',
          message: 'Authentication failed',
          details: error.response.data,
          statusCode: status,
          retryable: false,
        };
      }

      if (status >= 500) {
        return {
          type: 'server',
          message: 'Server error',
          details: error.response.data,
          statusCode: status,
          retryable: true,
        };
      }

      return {
        type: 'validation',
        message: 'Request validation failed',
        details: error.response.data,
        statusCode: status,
        retryable: false,
      };
    }

    return {
      type: 'network',
      message: error.message || 'Unknown error',
      details: error,
      retryable: true,
    };
  }

  private normalizeHeaders(headers: any): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = String(value);
    }
    return normalized;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Update authentication token
  updateAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Update base URL
  updateBaseUrl(baseUrl: string): void {
    this.client.defaults.baseURL = baseUrl;
  }

  // Get current configuration
  getConfig(): APITestConfig {
    return { ...this.config };
  }
}