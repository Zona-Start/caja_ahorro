import 'dotenv/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/database/schema';
import { BcvScraperService } from '../src/features/core/exchange-rate/bcv-scraper.service';
import { SettingsService } from '../src/features/core/settings/settings.service';

/**
 * Ejecuta manualmente la consulta de tasas de cambio del BCV y las guarda en la BD.
 * Uso: pnpm --filter api sync:rates
 */
async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    ssl: false,
  });

  const db = drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;

  const settingsService = {
    getGlobal: async () => 'true',
  } as unknown as SettingsService;

  const configService = {
    get: (key: string) =>
      key === 'BCV_ALLOW_INSECURE_TLS'
        ? process.env.BCV_ALLOW_INSECURE_TLS === 'true'
        : undefined,
  } as any;

  const scraper = new BcvScraperService(db, settingsService, configService);

  await scraper.fetchAndSaveRates();

  await pool.end();
}

main()
  .then(() => {
    console.log('✅ Sincronización de tasas de cambio completada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error sincronizando tasas de cambio:', error);
    process.exit(1);
  });
