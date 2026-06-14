import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { projectionInventoryStock } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { type ProjectionHandler } from './projection-handler';
import { type EventEnvelope, EventStoreService } from '@/shared/event-bus';
import { INVENTORY_EVENTS, PURCHASING_EVENTS } from '@/shared/event-types';

@Injectable()
export class InventoryStockProjection implements ProjectionHandler {
  readonly name = 'InventoryStockProjection';
  private readonly logger = new Logger(this.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly eventStore: EventStoreService,
  ) {}

  async handle<T>(event: string, envelope: EventEnvelope<T>): Promise<void> {
    switch (event) {
      case INVENTORY_EVENTS.MOVEMENT_CREATED:
        await this.applyMovementCreated(envelope as any);
        break;
      case INVENTORY_EVENTS.MOVEMENT_REVERSED:
        await this.applyMovementReversed(envelope as any);
        break;
      case INVENTORY_EVENTS.PRODUCT_CREATED:
        await this.applyProductCreated(envelope as any);
        break;
    }
  }

  async rebuild(): Promise<void> {
    this.logger.log('Rebuilding inventory stock projection from EventStore...');
    const movements = await this.eventStore.findByEventType(INVENTORY_EVENTS.MOVEMENT_CREATED);

    await this.db.delete(projectionInventoryStock);

    for (const event of movements) {
      if (event.envelope && typeof event.envelope === 'object') {
        const env = event.envelope as any;
        await this.handle(env.type ?? event.eventType, env);
      }
    }

    this.logger.log(`Rebuild complete: ${movements.length} events replayed`);
  }

  private async applyProductCreated(envelope: EventEnvelope): Promise<void> {
    const { tenantId, productId, name } = envelope.payload;

    await this.db
      .insert(projectionInventoryStock)
      .values({
        tenantId,
        itemId: productId,
        itemType: 'PRODUCT',
        itemName: name,
        currentQuantity: '0',
        committedQuantity: '0',
        availableQuantity: '0',
        lastEventId: envelope.eventId,
      })
      .onConflictDoNothing({
        target: [projectionInventoryStock.tenantId, projectionInventoryStock.itemId, projectionInventoryStock.itemType],
      });
  }

  private async applyMovementCreated(envelope: EventEnvelope): Promise<void> {
    const { tenantId, itemId, movementType, quantity } = envelope.payload;

    const existing = await this.db
      .select()
      .from(projectionInventoryStock)
      .where(
        and(
          eq(projectionInventoryStock.tenantId, tenantId),
          eq(projectionInventoryStock.itemId, itemId),
        ),
      )
      .limit(1);

    if (existing.length === 0) return;

    const current = existing[0];
    const qty = Number(quantity);
    const currentQty = Number(current.currentQuantity);
    let newQty = currentQty;

    switch (movementType) {
      case 'IN':
      case 'RECEIVED':
      case 'ADJUST_IN':
        newQty += qty;
        break;
      case 'OUT':
      case 'ADJUST_OUT':
        newQty -= qty;
        break;
      case 'COMMIT':
        break;
      case 'UN_COMMIT':
        break;
    }

    const committed = Number(current.committedQuantity);
    const available = newQty - committed;

    await this.db
      .update(projectionInventoryStock)
      .set({
        currentQuantity: String(newQty),
        availableQuantity: String(available >= 0 ? available : 0),
        lastEventId: envelope.eventId,
        updatedAt: new Date(),
      })
      .where(eq(projectionInventoryStock.id, current.id));
  }

  private async applyMovementReversed(envelope: EventEnvelope): Promise<void> {
    const { tenantId, itemId } = envelope.payload;

    const existing = await this.db
      .select()
      .from(projectionInventoryStock)
      .where(
        and(
          eq(projectionInventoryStock.tenantId, tenantId),
          eq(projectionInventoryStock.itemId, itemId),
        ),
      )
      .limit(1);

    if (existing.length === 0) return;

    const current = existing[0];
    const committed = Number(current.committedQuantity);
    const currentQty = Number(current.currentQuantity);
    const available = currentQty - committed;

    await this.db
      .update(projectionInventoryStock)
      .set({
        lastEventId: envelope.eventId,
        availableQuantity: String(available >= 0 ? available : 0),
        updatedAt: new Date(),
      })
      .where(eq(projectionInventoryStock.id, current.id));
  }
}
