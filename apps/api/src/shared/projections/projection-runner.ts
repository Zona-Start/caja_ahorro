import {
  EVENT_BUS_TOKEN,
  EventEnvelope,
  EventStoreService,
  IEventBus,
} from '@/shared/event-bus';
import {
  ACCOUNTING_EVENTS,
  BANKING_EVENTS,
  INVENTORY_EVENTS,
  LOAN_EVENTS,
  PARTNER_EVENTS,
  PURCHASING_EVENTS,
} from '@/shared/event-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { type ProjectionHandler } from './projection-handler';

const ALL_EVENTS = [
  ...Object.values(LOAN_EVENTS),
  ...Object.values(INVENTORY_EVENTS),
  ...Object.values(ACCOUNTING_EVENTS),
  ...Object.values(BANKING_EVENTS),
  ...Object.values(PURCHASING_EVENTS),
  ...Object.values(PARTNER_EVENTS),
];

@Injectable()
export class ProjectionRunner {
  private readonly logger = new Logger(ProjectionRunner.name);
  private handlers = new Map<string, ProjectionHandler[]>();

  constructor(
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
    private readonly eventStore: EventStoreService,
  ) {}

  register(handler: ProjectionHandler): void {
    this.logger.log(`Registering projection handler: ${handler.name}`);
    this.handlers.set(handler.name, [handler]);

    for (const event of ALL_EVENTS) {
      this.eventBus.subscribe(event, (envelope: EventEnvelope) => {
        handler.handle(event, envelope).catch((err) => {
          this.logger.error(
            `Projection ${handler.name} failed for ${event}: ${err.message}`,
          );
        });
      });
    }

    this.logger.log(
      `Projection ${handler.name} listening to ${ALL_EVENTS.length} event types`,
    );
  }

  getHandler(name: string): ProjectionHandler | undefined {
    const entries = this.handlers.get(name);
    return entries?.[0];
  }

  async rebuildAll(): Promise<void> {
    for (const [name] of this.handlers) {
      await this.rebuild(name);
    }
  }

  async rebuild(name: string): Promise<void> {
    const handler = this.getHandler(name);
    if (!handler) {
      this.logger.warn(`No handler found: ${name}`);
      return;
    }

    this.logger.log(`Rebuilding projection: ${name}`);
    await handler.rebuild();
    this.logger.log(`Rebuild complete: ${name}`);
  }
}
