/**
 * Dynamic API URL Configuration
 * Automatically detects environment and uses correct API URL
 */

export const getApiUrl = (): string => {
  // 1. Check for explicit environment variable (highest priority)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Check if we're in development (localhost)
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  
  if (isLocalhost) {
    // Development: use local backend
    return 'http://localhost:5050/api';
  }

  // 3. Production: use relative path (same domain)
  // This works when backend is at https://yourdomain.com/api/
  return '/api';
};

// Export the API URL
export const API_URL = getApiUrl();

// Event to trigger logout on token expiration
const TOKEN_EXPIRED_EVENT = 'tokenExpired';

/**
 * Dispatch event to trigger logout when token expires
 */
const handleTokenExpiration = () => {
  // Dispatch custom event that AuthContext will listen to
  window.dispatchEvent(new CustomEvent(TOKEN_EXPIRED_EVENT));
};

// Helper function to make API calls with proper error handling
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Check for 401 Unauthorized (expired/invalid token)
  if (response.status === 401) {
    console.warn('🔒 Authentication token expired or invalid. Logging out...');
    handleTokenExpiration();
  }

  return response;
};

// Export event name for AuthContext to listen to
export { TOKEN_EXPIRED_EVENT };

// Log API URL for debugging (only in development, can be removed in production)
// Uncomment below if you need to debug API URL issues
// if (process.env.NODE_ENV === 'development') {
//   console.log('🔗 API URL:', API_URL);
//   console.log('🔗 Hostname:', window.location.hostname);
//   console.log('🔗 Full URL will be:', `${API_URL}/auth/signup`);
// }

