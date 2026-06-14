import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEventBus, EventHandler } from './event-bus.interface';
import { InProcessEventBus } from './in-process-event-bus';
import { createEnvelope, type EventEnvelope, type EventSource } from './event-envelope';
import { EventStoreService } from './event-store.service';
import { EventTracerService } from './event-tracer.service';

interface RedisClient {
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string, callback: (message: string) => void): void;
  quit(): Promise<void>;
}

@Injectable()
export class RedisEventBus implements IEventBus, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisEventBus.name);
  private pubClient: RedisClient | null = null;
  private subClient: RedisClient | null = null;
  private redisAvailable = false;
  private readonly prefix = 'loan:events';
  private readonly env: string;

  constructor(
    private readonly localBus: InProcessEventBus,
    private readonly configService: ConfigService,
    private readonly eventStore: EventStoreService,
    private readonly tracer: EventTracerService,
  ) {
    this.env = this.configService.get<string>('NODE_ENV') ?? 'development';
  }

  async onModuleInit() {
    if (this.env === 'production') {
      await this.tryConnect();
      if (!this.redisAvailable) {
        this.logger.warn(
          'PRODUCTION mode but Redis unavailable — events will NOT be published. ' +
          'Set REDIS_URL env var or install ioredis.',
        );
      }
    }
  }

  private async tryConnect() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured');
      return;
    }
    try {
      await this.initRedis(redisUrl);
    } catch (err) {
      this.logger.warn(`Redis connection failed: ${(err as Error).message}`);
    }
  }

  private async initRedis(url: string) {
    const Redis = await this.loadRedis();
    if (!Redis) return;

    this.pubClient = new Redis(url) as unknown as RedisClient;
    this.subClient = new Redis(url) as unknown as RedisClient;

    await Promise.all([
      (this.pubClient as any).ping(),
      (this.subClient as any).ping(),
    ]);

    this.redisAvailable = true;
    this.logger.log('Redis Pub/Sub connected — operating as PRIMARY event bus');
  }

  private async loadRedis(): Promise<any | null> {
    try {
      const Redis = await import('ioredis');
      return Redis.default || Redis;
    } catch {
      this.logger.warn('ioredis not installed');
      return null;
    }
  }

  publish<T>(event: string, payload: T, source: EventSource = 'direct'): void {
    const envelope = createEnvelope(event, payload, undefined, source);
    const eventId = envelope.eventId;

    if (source === 'direct' && this.env === 'production') {
      this.logger.error(
        `[outbox.guard] DIRECT PUBLISH BLOCKED event=${event} id=${eventId}. ` +
        'Use outbox pattern: inject OutboxWriterService and call write(tx, event) inside your transaction.',
      );
      return;
    }

    this.tracer.published(envelope);
    this.eventStore.store(envelope);

    if (this.redisAvailable && this.pubClient) {
      const channel = `${this.prefix}:${event}`;
      const message = JSON.stringify(envelope);
      this.pubClient.publish(channel, message).catch((err) => {
        this.logger.error(`Redis publish failed for event ${eventId}: ${err.message}`);
        this.fallbackPublish(event, envelope);
      });
    } else if (this.env === 'production' && !this.redisAvailable) {
      this.logger.error(
        `Cannot publish event ${eventId} (${event}) — Redis unavailable in production`,
      );
    } else {
      this.localBus.publish(event, envelope.payload, source);
    }
  }

  private fallbackPublish<T>(event: string, envelope: EventEnvelope<T>): void {
    this.logger.warn(`Fallback to in-process for event ${envelope.eventId}`);
    this.localBus.publish(event, envelope.payload, envelope.source);
  }

  subscribe<T>(event: string, handler: EventHandler<EventEnvelope<T>>): void {
    this.localBus.subscribe(event, handler);

    if (this.redisAvailable && this.subClient) {
      const channel = `${this.prefix}:${event}`;
      this.subClient.subscribe(channel, (message: string) => {
        try {
          const envelope = JSON.parse(message) as EventEnvelope<T>;
          handler(envelope);
        } catch (err) {
          this.logger.error(`Redis message parse error: ${(err as Error).message}`);
        }
      });
    } else if (this.env !== 'production') {
      this.logger.debug(`Dev mode: events for ${event} handled in-process only`);
    }
  }

  unsubscribe(event: string, handler: EventHandler): void {
    this.localBus.unsubscribe(event, handler);
  }

  async onModuleDestroy() {
    if (this.pubClient) await this.pubClient.quit();
    if (this.subClient) await this.subClient.quit();
  }
}
