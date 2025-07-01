import { waitForPortOpen } from '@nx/node/utils';
import axios from 'axios';

declare global {
  var __TEARDOWN_MESSAGE__: string;
}

module.exports = async () => {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up E2E tests...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  console.log(`⏳ Waiting for backend server on ${host}:${port}...`);
  await waitForPortOpen(port, { host });

  // Health check
  try {
    console.log('🔍 Performing health check...');
    const _response = await axios.get(`http://${host}:${port}/api/health`, { timeout: 5000 });
    console.log('✅ Backend server is healthy');
  } catch (_error) {
    console.log('⚠️  Health check failed, but continuing with tests...');
    console.log('💡 Make sure the backend is running: pnpm nx serve backend');
  }

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
