import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'pnpm exec nx run frontend:dev',
      },
      ciWebServerCommand: 'pnpm exec nx run frontend:start',
      ciBaseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    }),
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:3000',
  },
});
