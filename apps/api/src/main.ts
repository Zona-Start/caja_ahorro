import { AppModule } from '@/app.module';
import { bootstrap } from '@/bootstrap';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

const main = async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn'], // 👈 Silencia el spam de inicialización de módulos
  });
  await bootstrap(app);
};

main().catch((error) => {
  console.error('💥 FATAL BOOTSTRAP ERROR:', error);
  process.exit(1);
});