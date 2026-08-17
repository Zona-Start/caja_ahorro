// src/bootstrap.ts
import { swagger } from '@/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { EnvironmentVariables } from './common/config/envs'; // Tipado estricto
import cookieParser = require('cookie-parser');

export const bootstrap = async (app: NestExpressApplication) => {
  const logger = app.get(Logger);

  // Obtenemos el servicio de configuración fuertemente tipado
  const configService =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  const port = configService.get('PORT', { infer: true });
  const host = configService.get('HOST', { infer: true });
  const allowCorsUrl = configService.get('ALLOW_CORS_URL', { infer: true });
  const platformDomain = (
    configService.get('PLATFORM_DOMAIN', { infer: true }) || 'zonastart.local'
  ).toLowerCase();

  app.useStaticAssets('./uploads', {
    prefix: '/assets',
  });

  const corsOrigins = allowCorsUrl.split(',').map((url) => url.trim());

  const isAllowedOrigin = (origin?: string): boolean => {
    if (!origin) return true;
    try {
      const hostname = new URL(origin).hostname.toLowerCase();
      if (corsOrigins.includes(origin)) return true;
      if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
      if (
        hostname === platformDomain ||
        hostname.endsWith(`.${platformDomain}`)
      ) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  app.enableCors({
    credentials: true,
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Device-Fingerprint',
      'X-Tenant-Id',
      'x-tenant-id',
    ],
  });

  app.useLogger(logger);
  app.useGlobalPipes(new ZodValidationPipe());
  app.use(cookieParser());
  app.setGlobalPrefix('api', { exclude: [''] });

  process.on('SIGTERM', async () => {
    logger.warn('Received SIGTERM, starting graceful shutdown...');
    await app.close();
    logger.log('Application closed successfully');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.warn('Received SIGINT, starting graceful shutdown...');
    await app.close();
    logger.log('Application closed successfully');
    process.exit(0);
  });

  await swagger(app);

  await app.listen(port, () => {
    logger.log(`🚀 Sistema iniciado en ${host}:${port}`);
  });
};
