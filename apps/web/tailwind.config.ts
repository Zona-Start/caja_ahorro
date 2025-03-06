import * as baseConfig from '@repo/shadcn/tailwind.config'; // Cambiado
import type { Config } from 'tailwindcss';
const config: Config = {
  presets: [baseConfig],
  content: [
    './app/**/*.{ts,tsx}',
    '../../packages/shadcn/src/**/*.{ts,tsx,css}',
  ],
};

export default config;
