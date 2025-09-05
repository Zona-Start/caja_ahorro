import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  accountsPayable,
  supplierTransactions,
} from '@/database/schema/administration';
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
import { CreateAccountPayableDto } from './dto/create-account-payable.dto';
import { CreateSupplierTransactionDto } from './dto/create-supplier-transaction.dto';
import { FilterAccountPayableDto } from './dto/filter-account-payable.dto';
import { UpdateAccountPayableDto } from './dto/update-account-payable.dto';

@Injectable()
export class AccountsPayableService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  async createCreditDebitNote(
    userId: number,
    dto: CreateSupplierTransactionDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const accountPayable = await db.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, dto.accountsPayableId),
    });

    if (!accountPayable) {
      throw new NotFoundException('Account payable not found');
    }

    const direction = dto.transactionType === 'CREDIT_NOTE' ? 'CR' : 'DR';
    const amount =
      dto.transactionType === 'CREDIT_NOTE'
        ? -Math.abs(dto.amount)
        : Math.abs(dto.amount);

    const newTransaction = await db
      .insert(supplierTransactions)
      .values({
        accountsPayableId: dto.accountsPayableId,
        transactionNumber:
          await this.generateCodeService.generateNextReference('TRS-P'),
        transactionType: dto.transactionType,
        transactionDate: dto.transactionDate.toISOString(),
        amount: dto.amount.toString(),
        direction: direction,
        currencyCode: accountPayable.currencyCode ?? 'VES',
        reference: dto.reference,
        createdById: userId,
      })
      .returning();

    const currentRemainingAmount = parseFloat(accountPayable.remainingAmount);
    const newRemainingAmount = currentRemainingAmount + amount;

    let status = accountPayable.status;

    if (newRemainingAmount < 0) {
      status = 'PENDING';
    } else if (newRemainingAmount === 0) {
      status = 'PAID';
    } else {
      if (status === 'PAID') {
        status = 'IN_PROGRESS';
      }
    }

    await db
      .update(accountsPayable)
      .set({
        remainingAmount: newRemainingAmount.toString(),
        status: status,
        updatedById: userId,
      })
      .where(eq(accountsPayable.id, dto.accountsPayableId));

    return newTransaction[0];
  }

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
      searchConditions.push(eq(accountsPayable.supplierId, supplierId));
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
        supplierId: schema.suppliers.id,
        supplierName: schema.suppliers.name,
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
        },
      })
      .from(accountsPayable)
      .leftJoin(
        schema.supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, schema.supplierInvoices.id),
      )
      .leftJoin(
        schema.suppliers,
        eq(accountsPayable.supplierId, schema.suppliers.id),
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
    const data = await this.drizzle
      .select()
      .from(accountsPayable)
      .leftJoin(
        schema.supplierInvoices,
        eq(
          schema.supplierInvoices.id,
          schema.accountsPayable.supplierInvoiceId,
        ),
      )
      .where(eq(accountsPayable.id, id));

    if (data.length === 0) {
      throw new NotFoundException('Account payable not found');
    }

    return data[0];
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
        status: accountsPayable.status,
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
      {
        newPaidAmount: number;
        newRemainingAmount: number;
        invoiceId: number;
        status: string;
      }
    >();

    for (const item of data) {
      const account = accountsMap.get(item.accountsPayableId as number);
      console.log('data', data);
      console.log('account', account);

      if (account && account.status !== 'ADVANCE') {
        const currentPaid = Number(account.paidAmount) || 0;
        const currentRemaining = Number(account.remainingAmount) || 0;
        const paymentAmount = Number(item.amount);
        const newPaidAmount = currentPaid + paymentAmount;
        const newRemainingAmount = currentRemaining - paymentAmount;
        console.log('newRemainingAmount', newRemainingAmount);

        if (newRemainingAmount < 0) {
          throw new BadRequestException(
            'El monto del pago excede el saldo restante.',
          );
        }

        updates.set(item.accountsPayableId as number, {
          newPaidAmount,
          newRemainingAmount,
          invoiceId: account.supplierInvoiceId as number,
          status: account.status,
        });
      }
    }

    // 5. Actualizar la base de datos y el estado de la factura
    for (const [id, newValues] of updates) {
      // Solo actualiza si no es un anticipo o si el anticipo está siendo aplicado
      // (aunque la lógica de aplicación de anticipos a facturas se manejaría en otro lugar)
      if (newValues.status !== 'ADVANCE') {
        await db
          .update(accountsPayable)
          .set({
            paidAmount: String(newValues.newPaidAmount),
            remainingAmount: String(newValues.newRemainingAmount),
            updatedById: userId,
            status: newValues.newRemainingAmount === 0 ? 'PAID' : 'IN_PROGRESS',
          })
          .where(eq(accountsPayable.id, id));
      }
    }
    return updates;
  }

  async applyAdvance(
    advanceId: number,
    amountToApply: number,
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.drizzle;

    const advance = await db.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, advanceId),
    });

    if (!advance) {
      throw new NotFoundException(`Advance with ID ${advanceId} not found`);
    }

    if (advance.status !== 'ADVANCE') {
      throw new BadRequestException(
        `Account payable ${advanceId} is not an advance.`,
      );
    }

    const remainingAmount = Number(advance.remainingAmount);
    // Los anticipos tienen remainingAmount negativo. Aplicar un monto lo acerca a 0.
    const newRemainingAmount = remainingAmount + amountToApply;

    if (newRemainingAmount > 0) {
      throw new BadRequestException(
        `Amount to apply (${amountToApply}) exceeds the remaining advance amount (${-remainingAmount}).`,
      );
    }

    const newStatus = newRemainingAmount === 0 ? 'ADVANCE_APPLIED' : 'ADVANCE';

    await db
      .update(accountsPayable)
      .set({
        remainingAmount: newRemainingAmount.toString(),
        paidAmount: '0.00',
        status: newStatus,
        updatedById: userId,
      })
      .where(eq(accountsPayable.id, advanceId));
  }
}
