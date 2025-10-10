import { swagger } from '@/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { envs } from './common/config/envs';

export const bootstrap = async (app: NestExpressApplication) => {
  const logger = app.get(Logger);
  // app.setGlobalPrefix('api');
  app.useStaticAssets('./uploads', {
    prefix: '/assets',
  });
  app.enableCors({
    credentials: true,
    origin: envs.allow_cors_url,
    //origin: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await swagger(app);
  await app.listen(envs.port!, () => {
    logger.log(`This application started at ${envs.host}:${envs.port}`);
  });
};
