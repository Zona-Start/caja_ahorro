import { Env } from '@/common/utils';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env>) => {
        const isDev = config.get('NODE_ENV') !== 'production';

        return {
          pinoHttp: {
            quietReqLogger: false,
            quietResLogger: false,
            level: 'debug',
            ...(isDev && { transport: { target: 'pino-pretty' } }),
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
