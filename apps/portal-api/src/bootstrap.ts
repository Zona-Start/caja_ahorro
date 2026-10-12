import { swagger } from '@/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { Env } from './common/config/envs';

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION (portal-api):', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION (portal-api):', reason);
});

export const bootstrap = async (app: NestExpressApplication) => {
  const logger = app.get(Logger);

  try {
    const configService = app.get<ConfigService<Env, true>>(ConfigService);

    const port = configService.get('PORT', { infer: true });
    const host = configService.get('HOST', { infer: true });
    const allowCorsUrl = configService.get('ALLOW_CORS_URL', { infer: true });

    const corsOrigins = allowCorsUrl
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    // Cabeceras de seguridad (CSP desactivada: Swagger UI usa scripts inline).
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }),
    );

    // req.ip correcto detrás de proxy/balanceador.
    app.set('trust proxy', 1);

    app.enableCors({
      credentials: true,
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed = corsOrigins.includes(origin);
        return callback(null, allowed);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Device-Fingerprint',
        'X-Tenant-Id',
      ],
    });

    app.useLogger(logger);
    app.use(cookieParser());
    app.setGlobalPrefix('api/portal', { exclude: [''] });

    process.on('SIGTERM', async () => {
      logger.warn('Received SIGTERM (portal-api), shutting down...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.warn('Received SIGINT (portal-api), shutting down...');
      await app.close();
      process.exit(0);
    });

    await swagger(app);

    await app.listen(port, () => {
      logger.log(`🚀 Portal API iniciado en ${host}:${port}`);
    });
  } catch (error) {
    logger.error('❌ Error fatal durante el arranque de portal-api:', error);
    process.exit(1);
  }
};
