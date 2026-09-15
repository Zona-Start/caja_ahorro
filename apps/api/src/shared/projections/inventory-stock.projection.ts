import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { projectionInventoryStock } from '@/database/schema';
import { type EventEnvelope, EventStoreService } from '@/shared/event-bus';
import { INVENTORY_EVENTS } from '@/shared/event-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type ProjectionHandler } from './projection-handler';

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
    const movements = await this.eventStore.findByEventType(
      INVENTORY_EVENTS.MOVEMENT_CREATED,
    );

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
        target: [
          projectionInventoryStock.tenantId,
          projectionInventoryStock.itemId,
          projectionInventoryStock.itemType,
        ],
      });
  }

  private async applyMovementCreated(envelope: EventEnvelope): Promise<void> {
    const { tenantId, itemId, movementType, quantity } = envelope.payload;

    const existing = await this.db
      .select({ id: projectionInventoryStock.id })
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

    let currentQtyExpr: ReturnType<typeof sql> | undefined;
    let committedQtyExpr: ReturnType<typeof sql> | undefined;
    let availableQtyExpr: ReturnType<typeof sql> | undefined;

    switch (movementType) {
      case 'IN':
      case 'RECEIVED':
      case 'ADJUST_IN':
        currentQtyExpr = sql`${projectionInventoryStock.currentQuantity} + ${qty}`;
        availableQtyExpr = sql`${projectionInventoryStock.availableQuantity} + ${qty}`;
        break;
      case 'OUT':
      case 'ADJUST_OUT':
        currentQtyExpr = sql`${projectionInventoryStock.currentQuantity} - ${qty}`;
        availableQtyExpr = sql`GREATEST(${projectionInventoryStock.availableQuantity} - ${qty}, 0)`;
        break;
      case 'COMMIT':
        committedQtyExpr = sql`${projectionInventoryStock.committedQuantity} + ${qty}`;
        availableQtyExpr = sql`GREATEST(${projectionInventoryStock.availableQuantity} - ${qty}, 0)`;
        break;
      case 'UN_COMMIT':
        committedQtyExpr = sql`${projectionInventoryStock.committedQuantity} - ${qty}`;
        availableQtyExpr = sql`${projectionInventoryStock.availableQuantity} + ${qty}`;
        break;
      default:
        return;
    }

    await this.db
      .update(projectionInventoryStock)
      .set({
        ...(currentQtyExpr ? { currentQuantity: currentQtyExpr } : {}),
        ...(committedQtyExpr ? { committedQuantity: committedQtyExpr } : {}),
        ...(availableQtyExpr ? { availableQuantity: availableQtyExpr } : {}),
        lastEventId: envelope.eventId,
        updatedAt: new Date(),
      })
      .where(eq(projectionInventoryStock.id, current.id));
  }

  private async applyMovementReversed(envelope: EventEnvelope): Promise<void> {
    const { tenantId, itemId } = envelope.payload;

    const existing = await this.db
      .select({ id: projectionInventoryStock.id })
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

    await this.db
      .update(projectionInventoryStock)
      .set({
        availableQuantity: sql`GREATEST(${projectionInventoryStock.currentQuantity} - ${projectionInventoryStock.committedQuantity}, 0)`,
        lastEventId: envelope.eventId,
        updatedAt: new Date(),
      })
      .where(eq(projectionInventoryStock.id, current.id));
  }
}
