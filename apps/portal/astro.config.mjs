// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  // `imageService: 'passthrough'`: el portal no usa la optimización de imágenes de
  // Astro, así no se provisiona el binding "IMAGES" de Cloudflare.
  adapter: cloudflare({ imageService: 'passthrough' }),
  // El portal no usa Astro Sessions (la sesión va por cookies propias p_at/p_rt):
  // se desactiva para no provisionar un namespace KV innecesario en Cloudflare.
  session: false,
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
