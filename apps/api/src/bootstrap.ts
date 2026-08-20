// src/bootstrap.ts
import { swagger } from '@/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { EnvironmentVariables } from './common/config/envs'; // Tipado estricto
import cookieParser = require('cookie-parser');

// Captura de errores no controlados a nivel de proceso
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
});

export const bootstrap = async (app: NestExpressApplication) => {
  const logger = app.get(Logger);

  try {
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

    // 1. CORS Diferenciado para endpoints públicos de resolución y auth inicial
    app.use('/api/public', (req, res, next) => {
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, X-Device-Fingerprint, X-Tenant-Id, x-tenant-id',
      );

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      next();
    });

    // 2. Validación estricta de CORS para las demás rutas autenticadas y privadas
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

  } catch (error) {
    logger.error('❌ Error fatal durante el arranque de la aplicación:', error);
    process.exit(1);
  }
};