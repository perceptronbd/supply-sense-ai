import axios from 'axios';

module.exports = async () => {
  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3004';
  axios.defaults.baseURL = `http://${host}:${port}`;

  // Set timeouts to prevent hanging
  axios.defaults.timeout = 10000; // 10 seconds timeout for all requests

  // Add response interceptor for better error handling
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.error(
          `❌ Cannot connect to backend server. Make sure the backend is running on port ${port}`
        );
        console.error('💡 Run: pnpm run backend:serve');
      }
      return Promise.reject(error);
    }
  );
};
