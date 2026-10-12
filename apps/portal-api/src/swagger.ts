import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export const swagger = async (app: NestExpressApplication) => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Portal del Asociado API')
    .setDescription(
      'API de autoservicio para asociados (realm de identidad propio).',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .addCookieAuth('portal_session')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  cleanupOpenApiDoc(document);

  SwaggerModule.setup('portal-docs', app, document);
};
