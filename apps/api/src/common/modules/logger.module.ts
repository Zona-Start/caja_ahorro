import { Env } from '@/common/utils';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoModule } from 'nestjs-pino';

type ReqLike = { method?: string; url?: string };

/**
 * Rutas cuyo auto-logging se omite para no saturar el rate limit:
 * health checks, assets estáticos y preflights CORS (OPTIONS).
 */
export const shouldIgnoreAutoLogging = (req: ReqLike): boolean => {
  const url = req.url ?? '';
  return (
    req.method === 'OPTIONS' ||
    url.startsWith('/assets') ||
    url.startsWith('/uploads') ||
    url.includes('/health')
  );
};

/**
 * Opciones de pino-http por entorno.
 * - production: nivel 'warn' (solo warn/error) y salida JSON sin pino-pretty.
 * - development: nivel 'debug' con pino-pretty.
 */
export const buildPinoHttpOptions = (nodeEnv?: string) => {
  const isProd = nodeEnv === 'production';

  return {
    level: isProd ? 'warn' : 'debug',
    quietReqLogger: true,
    quietResLogger: true,
    autoLogging: { ignore: shouldIgnoreAutoLogging },
    // pino-pretty SOLO en desarrollo: en producción salida JSON directa.
    ...(isProd
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              translateTime: 'SYS:standard',
            },
          },
        }),
  };
};

@Module({
  imports: [
    PinoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env>) =>
        ({ pinoHttp: buildPinoHttpOptions(config.get('NODE_ENV')) }) as const,
    }),
  ],
})
export class LoggerModule {}
