// lib/api.js
// Utility functions for API calls

export const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
};

export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getBackendUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Add timeout for production (cold start handling)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`API call failed for ${endpoint}:`, error);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server may be starting up, please try again.');
    }
    throw error;
  }
};
