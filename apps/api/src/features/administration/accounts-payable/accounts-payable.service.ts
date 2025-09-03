import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { accountsPayable } from '@/database/schema/administration';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { CreateAccountPayableDto } from './dto/create-account-payable.dto';
import { FilterAccountPayableDto } from './dto/filter-account-payable.dto';
import { UpdateAccountPayableDto } from './dto/update-account-payable.dto';

@Injectable()
export class AccountsPayableService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
  ) {}

  async create(
    userId: number,
    data: CreateAccountPayableDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    const exist = await db.query.accountsPayable.findFirst({
      where: eq(accountsPayable.supplierInvoiceId, data.supplierInvoiceId),
    });

    if (exist) {
      throw new BadRequestException(
        'Account payable for this invoice already exists',
      );
    }

    const newAccountPayable = await db
      .insert(accountsPayable)
      .values({
        ...data,
        currencyCode: data.currencyCode || 'VES',
        accountsPayableNumber:
          await this.generateCodeService.generateNextReference('CXP'),
        originalAmount: data.originalAmount.toString(),
        paidAmount: data.paidAmount?.toString() || '0.00',
        remainingAmount: data.remainingAmount.toString(),
        dueDate: data.dueDate?.toISOString() || null,
        createdById: userId,
      })
      .returning();

    return newAccountPayable[0];
  }

  async findAll(paginationDto: FilterAccountPayableDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      supplierId,
      supplierInvoiceId,
      status,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(
        ilike(accountsPayable.accountsPayableNumber, `%${search}%`),
      );
    }
    if (supplierId) {
      searchConditions.push(eq(schema.supplierInvoices.supplierId, supplierId));
    }
    if (supplierInvoiceId) {
      searchConditions.push(
        eq(accountsPayable.supplierInvoiceId, supplierInvoiceId),
      );
    }
    if (status) {
      searchConditions.push(eq(accountsPayable.status, status as any));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${accountsPayable[sortBy as keyof typeof accountsPayable]} asc`
        : sql`${accountsPayable[sortBy as keyof typeof accountsPayable]} desc`;

    const query = this.drizzle
      .select({
        id: schema.accountsPayable.id,
        accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        supplierInvoiceId: schema.accountsPayable.supplierInvoiceId,
        originalAmount: schema.accountsPayable.originalAmount,
        paidAmount: schema.accountsPayable.paidAmount,
        remainingAmount: schema.accountsPayable.remainingAmount,
        status: schema.accountsPayable.status,
        observations: schema.accountsPayable.observations,
        dueDate: schema.accountsPayable.dueDate,
        createdAt: schema.accountsPayable.createdAt,
        supplierInvoice: {
          invoiceNumber: schema.supplierInvoices.invoiceNumber,
          supplierName: schema.suppliers.name,
        },
      })
      .from(accountsPayable)
      .leftJoin(
        schema.supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, schema.supplierInvoices.id),
      )
      .leftJoin(
        schema.suppliers,
        eq(schema.supplierInvoices.supplierId, schema.suppliers.id),
      )
      .where(searchCondition)
      .orderBy(orderBy);

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(accountsPayable)
      .leftJoin(
        schema.supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, schema.supplierInvoices.id),
      )
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await query.limit(limit).offset(offset);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  async findOne(id: number) {
    const data = await this.drizzle.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, id),
      with: {
        supplierInvoice: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Account payable not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdateAccountPayableDto) {
    const exist = await this.drizzle.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Account payable not found');
    }

    const updatedAccountPayable = await this.drizzle
      .update(accountsPayable)
      .set({
        ...data,
        originalAmount: data.originalAmount?.toString(),
        paidAmount: data.paidAmount?.toString(),
        remainingAmount: data.remainingAmount?.toString(),
        dueDate: data.dueDate?.toISOString() || null,
        updatedById: userId,
      })
      .where(eq(accountsPayable.id, id))
      .returning();

    return updatedAccountPayable[0];
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Account payable not found');
    }

    await this.drizzle
      .delete(accountsPayable)
      .where(eq(accountsPayable.id, id));

    return { message: 'Account payable removed successfully' };
  }

  // async generateAccountPayableReport(id: number): Promise<Buffer> {
  //   const accountPayable = await this.drizzle.query.accountsPayable.findFirst({
  //     where: eq(accountsPayable.id, id),
  //     with: {
  //       supplierInvoice: {
  //         with: {
  //           supplier: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!accountPayable) {
  //     throw new NotFoundException('Account payable not found');
  //   }

  //   const docDefinition = {
  //     content: [
  //       { text: 'Reporte de Cuenta por Pagar', style: 'header' },
  //       { text: `Número de Referencia: ${accountPayable.accountsPayableNumber}` },
  //       { text: `Factura de Proveedor: ${accountPayable.supplierInvoice?.invoiceNumber || 'N/A'}` },
  //       { text: `Proveedor: ${accountPayable.supplierInvoice?.supplier?.name || 'N/A'}` },
  //       { text: `Monto Original: ${accountPayable.originalAmount} ${accountPayable.currencyCode}` },
  //       { text: `Monto Pagado: ${accountPayable.paidAmount} ${accountPayable.currencyCode}` },
  //       { text: `Monto Restante: ${accountPayable.remainingAmount} ${accountPayable.currencyCode}` },
  //       { text: `Estatus: ${accountPayable.status}` },
  //       { text: `Fecha de Vencimiento: ${accountPayable.dueDate ? new Date(accountPayable.dueDate).toLocaleDateString() : 'N/A'}` },
  //       { text: `Observaciones: ${accountPayable.observations || 'N/A'}` },
  //     ],
  //     styles: {
  //       header: {
  //         fontSize: 18,
  //         bold: true,
  //         margin: [0, 0, 0, 10],
  //       },
  //     },
  //   };

  //   return this.pdfGeneratorService.generatePdf(docDefinition);
  // }

  async getPreloadedPaymentData(id: number) {
    const [result] = await this.drizzle
      .select({
        supplierId: schema.supplierInvoices.supplierId,
        chargePayment: schema.supplierInvoices.chargePayment,
        bankAccountId: schema.supplierInvoices.bankAccountId,
        paymentDescription: schema.supplierInvoices.paymentDescription,
        paymentMethod: schema.supplierInvoices.paymentMethod,
        bankReference: schema.supplierInvoices.paymentBankReference,
        transactionDate: schema.supplierInvoices.transactionDate,
        amount: accountsPayable.remainingAmount, // Precargar el monto restante
      })
      .from(accountsPayable)
      .leftJoin(
        schema.supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, schema.supplierInvoices.id),
      )
      .where(eq(accountsPayable.id, id));

    if (!result.chargePayment) {
      return null; // No hay datos que precargar
    }

    return {
      supplierId: result.supplierId,
      bankAccountId: result.bankAccountId,
      paymentDescription: result.paymentDescription,
      paymentMethod: result.paymentMethod,
      bankReference: result.bankReference,
      transactionDate: result.transactionDate,
      amount: result.amount, // Precargar el monto restante
    };
  }

  async updateBalances(
    data: { accountsPayableId: number | null; amount: string | number }[],
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.drizzle;

    // 1. Obtener todos los IDs únicos de las cuentas por pagar de los datos
    const accountsPayableIds = data.map((item) => item.accountsPayableId);
    const uniqueAccountsIds = [...new Set(accountsPayableIds)];

    if (uniqueAccountsIds.length === 0) {
      return;
    }

    // 2. Obtener todas las cuentas por pagar, incluyendo el ID de la factura asociada
    const accountsToUpdate = await db
      .select({
        id: accountsPayable.id,
        remainingAmount: accountsPayable.remainingAmount,
        paidAmount: accountsPayable.paidAmount,
        supplierInvoiceId: accountsPayable.supplierInvoiceId, // <-- Asegúrate de que este campo exista
      })
      .from(accountsPayable)
      .where(
        inArray(
          accountsPayable.id,
          uniqueAccountsIds.filter((id): id is number => id !== null),
        ),
      );

    if (accountsToUpdate.length === 0) {
      throw new NotFoundException('Cuentas por pagar no encontradas.');
    }

    const accountsMap = new Map(accountsToUpdate.map((ap) => [ap.id, ap]));
    const updates = new Map<
      number,
      { newPaidAmount: number; newRemainingAmount: number; invoiceId: number }
    >();

    for (const item of data) {
      const account = accountsMap.get(item.accountsPayableId as number);

      if (account) {
        const currentPaid = Number(account.paidAmount) || 0;
        const currentRemaining = Number(account.remainingAmount) || 0;
        const paymentAmount = Number(item.amount);
        const newPaidAmount = currentPaid + paymentAmount;
        const newRemainingAmount = currentRemaining - paymentAmount;

        if (newRemainingAmount < 0) {
          throw new BadRequestException(
            'El monto del pago excede el saldo restante.',
          );
        }

        updates.set(item.accountsPayableId as number, {
          newPaidAmount,
          newRemainingAmount,
          invoiceId: account.supplierInvoiceId,
        });
      }
    }

    // 5. Actualizar la base de datos y el estado de la factura
    for (const [id, newValues] of updates) {
      await db
        .update(accountsPayable)
        .set({
          paidAmount: String(newValues.newPaidAmount),
          remainingAmount: String(newValues.newRemainingAmount),
          updatedById: userId,
          status: newValues.newRemainingAmount === 0 ? 'PAID' : 'IN_PROGRESS',
        })
        .where(eq(accountsPayable.id, id));

      // Llama al servicio SOLO cuando el saldo restante es 0
      if (newValues.newRemainingAmount === 0) {
        await db
          .update(schema.supplierInvoices)
          .set({ status: 'PAID' })
          .where(eq(schema.supplierInvoices.id, newValues.invoiceId));

        const ordeId = await db
          .select({
            purchaseOrderId: schema.supplierInvoices.purchaseOrderId,
          })
          .from(schema.supplierInvoices)
          .where(eq(schema.supplierInvoices.id, newValues.invoiceId));
        if (ordeId[0].purchaseOrderId) {
          await this.purchaseOrdersService.updateStatusToClosed(
            ordeId[0].purchaseOrderId,
          );
        }
      }
    }
    return updates;
  }
}
