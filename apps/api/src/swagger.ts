// src/swagger.ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// 1. Importamos la nueva función de limpieza en lugar del parche
import { cleanupOpenApiDoc } from 'nestjs-zod';

export const swagger = async (app: NestExpressApplication) => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Caja Ahorro API')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // 2. Ejecutamos la limpieza sobre el documento YA creado
  cleanupOpenApiDoc(document);

  SwaggerModule.setup('api-docs', app, document);
};
