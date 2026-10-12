import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1000, limit: 10 }, // 1s
        { name: 'medium', ttl: 10000, limit: 20 }, // 10s
        { name: 'long', ttl: 60000, limit: 60 }, // 1min
      ],
      errorMessage: 'Demasiadas solicitudes, intente más tarde.',
    }),
  ],
})
export class ThrottleModule {}
