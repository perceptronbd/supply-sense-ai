/**
 * Environment configuration
 * Reads API URL from Next.js environment variables
 */

export const config = {
  /**
   * Backend API base URL
   * Defaults to http://localhost:3004 if not set in environment
   */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3004',

  /**
   * Get the full API URL with a path
   * @param path - API endpoint path (with or without leading slash)
   * @returns Full API URL
   */
  getApiUrl: (path = '') => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${config.apiUrl}${cleanPath}`;
  },
};

export default config;
