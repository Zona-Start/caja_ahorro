// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  server: { port: 4321, host: true },
  env: {
    schema: {
      /** URL base de portal-api (server-only). */
      PORTAL_API_URL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'http://localhost:3001/api/portal',
      }),
      /** Si es true, todo redirige a /maintenance. */
      MAINTENANCE_MODE: envField.boolean({
        context: 'server',
        access: 'secret',
        default: false,
      }),
      /** Dev/localhost: host de tenant a usar cuando el host real no resuelve. */
      PORTAL_DEFAULT_TENANT_HOST: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },
});
