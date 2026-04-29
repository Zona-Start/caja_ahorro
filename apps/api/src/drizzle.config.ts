import 'dotenv/config';
import type { Config } from 'drizzle-kit';
import { envVarsSchema } from './common/config/envs';

const envVars = envVarsSchema.parse(process.env);

export default {
  schema: './src/database/schema', // Path to schema file
  out: './src/database/migrations', // Path to output directory
  dialect: 'postgresql', // Database dialect
  schemaFilter: [
    'public',
    'auth',
    'accounting',
    'savings-banks',
    'treasury',
    'purchasing',
    'inventory',
    'core',
    'audit',
  ],
  dbCredentials: {
    url: envVars.DATABASE_URL,
  },
} satisfies Config;
