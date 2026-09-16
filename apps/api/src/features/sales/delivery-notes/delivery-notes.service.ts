import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  customers,
  products,
  salesDeliveryNoteItems,
  salesDeliveryNotes,
  salesInvoiceItems,
} from '@/database/schema/tables';
import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateDeliveryNoteDto,
  FilterDeliveryNoteDto,
} from './dto/delivery-notes.schema';

interface DeliveryNoteItemInput {
  productId: string;
  quantity: number;
}

@Injectable()
export class DeliveryNotesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  private async createNote(
    tenantId: string,
    userId: string,
    customerId: string,
    items: DeliveryNoteItemInput[],
    invoiceId?: string,
    notes?: string,
  ) {
    const deliveryNumber = await this.generateCodeService.generateGlobalCode(
      'NE',
      tenantId,
      'sales',
      'delivery_notes',
    );

    const note = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(salesDeliveryNotes)
        .values({
          tenantId,
          customerId,
          orderId: null,
          deliveryNumber,
          status: 'DISPATCHED',
          issueDate: new Date(),
          notes: notes ?? null,
        })
        .returning();

      await tx.insert(salesDeliveryNoteItems).values(
        items.map((item) => ({
          deliveryNoteId: created.id,
          productId: item.productId,
          quantity: String(item.quantity),
        })),
      );

      return created;
    });

    // Best effort link back to the source invoice.
    if (invoiceId) {
      // The FK lives on sales_invoices.delivery_note_id.
      await this.db
        .update(schema.salesInvoices)
        .set({ deliveryNoteId: note.id, updatedBy: userId, updatedAt: new Date() })
        .where(
          and(
            eq(schema.salesInvoices.id, invoiceId),
            eq(schema.salesInvoices.tenantId, tenantId),
          ),
        );
    }

    return note;
  }

  async create(tenantId: string, userId: string, dto: CreateDeliveryNoteDto) {
    const note = await this.createNote(
      tenantId,
      userId,
      dto.customerId,
      dto.items,
      dto.invoiceId,
      dto.notes,
    );
    return { message: 'Nota de entrega generada correctamente', data: note };
  }

  async createFromInvoice(invoiceId: string, tenantId: string, userId: string) {
    const [invoice] = await this.db
      .select()
      .from(schema.salesInvoices)
      .where(
        and(
          eq(schema.salesInvoices.id, invoiceId),
          eq(schema.salesInvoices.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!invoice) {
      throw new NotFoundException('Factura de venta no encontrada');
    }

    const items = await this.db
      .select({
        productId: salesInvoiceItems.productId,
        quantity: salesInvoiceItems.quantity,
      })
      .from(salesInvoiceItems)
      .where(eq(salesInvoiceItems.invoiceId, invoiceId));

    return this.createNote(
      tenantId,
      userId,
      invoice.customerId,
      items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
      invoiceId,
      `Nota de entrega de la factura ${invoice.invoiceNumber}`,
    );
  }

  async findAllByPagination(tenantId: string, dto: FilterDeliveryNoteDto) {
    const { page = 1, limit = 10, search = '', customerId, status } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [eq(salesDeliveryNotes.tenantId, tenantId)];

    if (customerId) {
      conditions.push(eq(salesDeliveryNotes.customerId, customerId));
    }
    if (status) {
      conditions.push(eq(salesDeliveryNotes.status, status));
    }
    if (search) {
      conditions.push(
        sql`(${ilike(salesDeliveryNotes.deliveryNumber, `%${search}%`)} OR ${ilike(customers.name, `%${search}%`)})`,
      );
    }

    const whereClause = and(...conditions);

    const [total] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(salesDeliveryNotes)
      .leftJoin(customers, eq(salesDeliveryNotes.customerId, customers.id))
      .where(whereClause);

    const data = await this.db
      .select({
        id: salesDeliveryNotes.id,
        deliveryNumber: salesDeliveryNotes.deliveryNumber,
        status: salesDeliveryNotes.status,
        issueDate: salesDeliveryNotes.issueDate,
        notes: salesDeliveryNotes.notes,
        customerId: salesDeliveryNotes.customerId,
        customerName: customers.name,
        createdAt: salesDeliveryNotes.createdAt,
      })
      .from(salesDeliveryNotes)
      .leftJoin(customers, eq(salesDeliveryNotes.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(salesDeliveryNotes.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCount = Number(total.count);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      data,
      meta: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const [note] = await this.db
      .select({
        id: salesDeliveryNotes.id,
        deliveryNumber: salesDeliveryNotes.deliveryNumber,
        status: salesDeliveryNotes.status,
        issueDate: salesDeliveryNotes.issueDate,
        notes: salesDeliveryNotes.notes,
        customerId: salesDeliveryNotes.customerId,
        customerName: customers.name,
        createdAt: salesDeliveryNotes.createdAt,
      })
      .from(salesDeliveryNotes)
      .leftJoin(customers, eq(salesDeliveryNotes.customerId, customers.id))
      .where(
        and(
          eq(salesDeliveryNotes.id, id),
          eq(salesDeliveryNotes.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!note) {
      throw new NotFoundException('Nota de entrega no encontrada');
    }

    const items = await this.db
      .select({
        id: salesDeliveryNoteItems.id,
        productId: salesDeliveryNoteItems.productId,
        productName: products.name,
        quantity: salesDeliveryNoteItems.quantity,
      })
      .from(salesDeliveryNoteItems)
      .leftJoin(products, eq(salesDeliveryNoteItems.productId, products.id))
      .where(eq(salesDeliveryNoteItems.deliveryNoteId, id));

    return {
      ...note,
      items: items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
      })),
    };
  }
}
