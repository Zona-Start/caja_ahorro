import type { Config } from 'drizzle-kit';
import { envs } from './common/config/envs';


export default {
  schema: './src/database/schema/*', // Path to schema file
  out: './src/database/migrations', // Path to output directory
  dialect: 'postgresql', // Database dialect
  schemaFilter: ["public", "auth"],
  dbCredentials: {
    url: envs.dataBaseUrl,
  },
} satisfies Config;
