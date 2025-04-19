import { Env } from '@/common/utils';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env>) => ({
        pinoHttp: {
          quietReqLogger: false, // Cambiar a false para ver los logs de request
          quietResLogger: false, // Cambiar a false para ver los logs de response
          level: 'debug', // Asegura que se logueen errores
          transport: {
            target:
              config.get('NODE_ENV') !== 'production' ? 'pino-pretty' : '',
          },
        },
      }),
    }),
  ],
})
export class LoggerModule {}
