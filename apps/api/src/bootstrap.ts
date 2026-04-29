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

  app.useStaticAssets('./uploads', {
    prefix: '/assets',
  });

  // Usamos las variables reales del entorno para el CORS
  const corsOrigins = allowCorsUrl.split(',').map((url) => url.trim());

  app.enableCors({
    credentials: true,
    origin: corsOrigins,
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
