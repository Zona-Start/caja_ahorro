import { Global, Module, OnModuleInit } from '@nestjs/common';
import { OutboxWriterService } from './outbox-writer.service';
import { OutboxProcessor } from './outbox.processor';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [OutboxWriterService, OutboxProcessor],
  exports: [OutboxWriterService],
})
export class OutboxModule implements OnModuleInit {
  constructor(
    private readonly processor: OutboxProcessor,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const env = this.configService.get<string>('NODE_ENV') ?? 'development';
    if (env === 'production') {
      this.processor.start();
    } else {
      this.processor.start();
    }
  }
}
