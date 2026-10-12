// Portal del Asociado · PM2 ecosystem (ejemplo)
//
// Requisitos:
//   - Node >= 22.12 (Astro 7) para `portal`; Node >= 20 para `portal-api`.
//   - Variables de entorno cargadas desde apps/*/.env (o definidas aquí).
//
// Uso:  pm2 start deploy/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'portal-api',
      cwd: './apps/portal-api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'portal',
      cwd: './apps/portal',
      script: 'dist/server/entry.mjs',
      instances: 1,
      exec_mode: 'fork',
      // Descomenta para forzar un binario Node 22 concreto:
      // interpreter: '/usr/local/bin/node22',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '4321',
      },
    },
  ],
};
