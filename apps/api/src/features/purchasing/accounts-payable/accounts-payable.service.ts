import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  accountsPayable,
  purchaseOrders,
  supplierAdvances,
  supplierCreditNotes,
  supplierDebitNotes,
  supplierInvoices,
  suppliers,
  supplierTransactionApplications,
  supplierTransactions,
} from '@/database/schema';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class AccountsPayableService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  async create(userId: string, data: any, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.drizzle;

    const supplier = await db
      .select()
      .from(suppliers)
      .where(
        and(eq(suppliers.id, data.supplierId), eq(suppliers.status, 'ACTIVE')),
      );

    if (supplier.length === 0) {
      throw new BadRequestException(
        'Supplier is not active or does not exist.',
      );
    }

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
        tenantId: data.tenantId,
        supplierId: data.supplierId,
        supplierInvoiceId: data.supplierInvoiceId,
        accountsPayableNumber:
          await this.generateCodeService.generateNextReference(
            'CXP',
            data.tenantId,
            'purchasing',
            'accounts-payable',
          ),
        originalAmount: data.originalAmount.toString(),
        paidAmount: data.paidAmount?.toString() || '0.00',
        remainingAmount: data.remainingAmount.toString(),
        currencyCode: data.currencyCode || 'VES',
        status: data.status || 'PENDING',
        dueDate: data.dueDate
          ? data.dueDate instanceof Date
            ? data.dueDate.toISOString()
            : String(data.dueDate)
          : null,
        priority: data.priority || 'NORMAL',
        isAuthorizePayment: data.isAuthorizePayment ?? false,
        observations: data.observations,
        createdById: userId,
      })
      .returning();

    return newAccountPayable[0];
  }

  async findAll(paginationDto: any, tenantId: string) {
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

    const searchConditions: SQL<unknown>[] = [
      eq(accountsPayable.tenantId, tenantId),
    ];

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
      if (Array.isArray(status)) {
        searchConditions.push(inArray(accountsPayable.status, status));
      } else {
        searchConditions.push(eq(accountsPayable.status, status));
      }
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${accountsPayable[sortBy as keyof typeof accountsPayable]} asc`
        : sql`${accountsPayable[sortBy as keyof typeof accountsPayable]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(accountsPayable)
      .leftJoin(
        supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, supplierInvoices.id),
      )
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.drizzle
      .select({
        id: accountsPayable.id,
        supplierId: suppliers.id,
        supplierName: suppliers.name,
        accountsPayableNumber: accountsPayable.accountsPayableNumber,
        supplierInvoiceId: accountsPayable.supplierInvoiceId,
        supplierInvoiceNumber: supplierInvoices.supplierInvoiceNumber,
        originalAmount: accountsPayable.originalAmount,
        paidAmount: accountsPayable.paidAmount,
        remainingAmount: accountsPayable.remainingAmount,
        status: accountsPayable.status,
        observations: accountsPayable.observations,
        dueDate: accountsPayable.dueDate,
        createdAt: accountsPayable.createdAt,
        isAuthorizePayment: accountsPayable.isAuthorizePayment,
        invoiceNumber: supplierInvoices.invoiceNumber,
      })
      .from(accountsPayable)
      .leftJoin(
        supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, supplierInvoices.id),
      )
      .leftJoin(suppliers, eq(accountsPayable.supplierId, suppliers.id))
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

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

  async findOne(id: string, tenantId: string) {
    const [result] = await this.drizzle
      .select({
        id: accountsPayable.id,
        supplierId: suppliers.id,
        supplierName: suppliers.name,
        accountsPayableNumber: accountsPayable.accountsPayableNumber,
        supplierInvoiceId: accountsPayable.supplierInvoiceId,
        supplierInvoiceNumber: supplierInvoices.supplierInvoiceNumber,
        originalAmount: accountsPayable.originalAmount,
        paidAmount: accountsPayable.paidAmount,
        remainingAmount: accountsPayable.remainingAmount,
        status: accountsPayable.status,
        observations: accountsPayable.observations,
        dueDate: accountsPayable.dueDate,
        createdAt: accountsPayable.createdAt,
        isAuthorizePayment: accountsPayable.isAuthorizePayment,
        invoiceNumber: supplierInvoices.invoiceNumber,
      })
      .from(accountsPayable)
      .leftJoin(
        supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, supplierInvoices.id),
      )
      .leftJoin(suppliers, eq(accountsPayable.supplierId, suppliers.id))
      .where(
        and(eq(accountsPayable.id, id), eq(accountsPayable.tenantId, tenantId)),
      );

    if (!result) throw new NotFoundException('Account payable not found');
    return result;
  }

  async autorize(userId: string, id: string, tenantId: string) {
    const exist = await this.drizzle.query.accountsPayable.findFirst({
      where: and(
        eq(accountsPayable.id, id),
        eq(accountsPayable.tenantId, tenantId),
      ),
    });

    if (!exist) {
      throw new NotFoundException('Account payable not found');
    }

    if (exist.status !== 'PENDING') {
      throw new BadRequestException(
        'The account payable is already authorized for payment',
      );
    }

    const [updated] = await this.drizzle
      .update(accountsPayable)
      .set({ status: 'APPROVED', isAuthorizePayment: true, updatedById: userId })
      .where(
        and(eq(accountsPayable.id, id), eq(accountsPayable.tenantId, tenantId)),
      )
      .returning();

    if (!updated) throw new NotFoundException('Account payable not found');

    return this.findOne(id, tenantId);
  }

  async update(userId: string, id: string, dto: any, tenantId: string) {
    const [existing] = await this.drizzle
      .select()
      .from(accountsPayable)
      .where(
        and(eq(accountsPayable.id, id), eq(accountsPayable.tenantId, tenantId)),
      );

    if (!existing) {
      throw new NotFoundException('Account payable not found');
    }

    const updateData: Record<string, any> = { updatedById: userId };
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.observations !== undefined) updateData.observations = dto.observations;
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate instanceof Date
        ? dto.dueDate.toISOString()
        : dto.dueDate;
    }
    if (dto.isAuthorizePayment !== undefined) {
      updateData.isAuthorizePayment = dto.isAuthorizePayment;
    }

    const [updated] = await this.drizzle
      .update(accountsPayable)
      .set(updateData)
      .where(eq(accountsPayable.id, id))
      .returning();

    return updated;
  }

  async createAdvanceSupplier(dto: any, userId: string, tenantId: string) {
    const supplier = await this.drizzle
      .select()
      .from(suppliers)
      .where(
        and(eq(suppliers.id, dto.supplierId), eq(suppliers.status, 'ACTIVE')),
      );
    if (supplier.length === 0) {
      throw new NotFoundException('Supplier not found');
    }

    return this.drizzle.transaction(async (tx) => {
      const supplierAdvanceNumber =
        await this.generateCodeService.generateNextReference(
          'ADV-P',
          tenantId,
          'purchasing',
          'advances',
          tx,
        );

      const [newSupplierTransaction] = await tx
        .insert(supplierTransactions)
        .values({
          tenantId,
          supplierId: dto.supplierId,
          transactionNumber: supplierAdvanceNumber,
          transactionType: 'ADVANCE',
          transactionDate: new Date().toISOString(),
          amount: dto.amount.toString(),
          currencyCode: 'VES',
          status: 'ACTIVE',
          observations: dto.observations ?? 'Anticipo a proveedor',
          createdById: userId,
        })
        .returning({
          id: supplierTransactions.id,
          transactionNumber: supplierTransactions.transactionNumber,
          transactionType: supplierTransactions.transactionType,
          transactionDate: supplierTransactions.transactionDate,
          amount: supplierTransactions.amount,
          currencyCode: supplierTransactions.currencyCode,
          status: supplierTransactions.status,
          observations: supplierTransactions.observations,
        });

      await tx.insert(supplierAdvances).values({
        tenantId,
        supplierAdvanceNumber: supplierAdvanceNumber,
        transactionId: newSupplierTransaction.id,
        supplierId: dto.supplierId,
        amount: dto.amount.toString(),
        availableAmount: dto.amount.toString(),
        createdById: userId,
      });

      return newSupplierTransaction;
    });
  }

  async createCreditDebitNote(
    userId: string,
    dto: any,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const supplier = await db
      .select()
      .from(suppliers)
      .where(
        and(eq(suppliers.id, dto.supplierId), eq(suppliers.status, 'ACTIVE')),
      );
    if (supplier.length === 0) {
      throw new NotFoundException('Supplier not found');
    }

    return db.transaction(async (tx) => {
      const typeReference =
        dto.transactionType === 'CREDIT_NOTE' ? 'NC-P' : 'ND-P';
      const referenceNumber =
        await this.generateCodeService.generateNextReference(
          typeReference,
          tenantId,
          'purchasing',
          'transactions',
          tx,
        );

      const [newSupplierTransaction] = await tx
        .insert(supplierTransactions)
        .values({
          tenantId,
          supplierId: dto.supplierId,
          transactionNumber: referenceNumber,
          transactionType:
            dto.transactionType === 'CREDIT_NOTE'
              ? 'CREDIT_NOTE'
              : 'DEBIT_NOTE',
          transactionDate: new Date().toISOString(),
          amount: dto.amount.toString(),
          currencyCode: 'VES',
          status: dto.transactionType === 'DEBIT_NOTE' ? 'APPLIED' : 'ACTIVE',
          observations:
            dto.observations ??
            (dto.transactionType === 'CREDIT_NOTE'
              ? 'Nota de crédito a proveedor'
              : 'Nota de débito a proveedor'),
          createdById: userId,
        })
        .returning({
          id: supplierTransactions.id,
          transactionNumber: supplierTransactions.transactionNumber,
          transactionType: supplierTransactions.transactionType,
          transactionDate: supplierTransactions.transactionDate,
          amount: supplierTransactions.amount,
          currencyCode: supplierTransactions.currencyCode,
          status: supplierTransactions.status,
          observations: supplierTransactions.observations,
        });

      if (dto.transactionType === 'CREDIT_NOTE') {
        await tx.insert(supplierCreditNotes).values({
          tenantId,
          transactionId: newSupplierTransaction.id,
          supplierId: dto.supplierId,
          accountsPayableId: dto.accountsPayableId || null,
          creditNoteNumber: referenceNumber,
          reason: dto.reason,
          amount: dto.amount.toString(),
          availableAmount: dto.amount.toString(),
          createdById: userId,
        });
      } else if (
        dto.transactionType === 'DEBIT_NOTE' &&
        dto.accountsPayableId
      ) {
        const accountPayable = await db
          .select()
          .from(accountsPayable)
          .where(eq(accountsPayable.id, dto.accountsPayableId));

        await tx.insert(supplierDebitNotes).values({
          tenantId,
          transactionId: newSupplierTransaction.id,
          supplierId: dto.supplierId,
          accountsPayableId: dto.accountsPayableId,
          debitNoteNumber: referenceNumber,
          reason: dto.reason,
          amount: dto.amount.toString(),
          createdById: userId,
        });

        await tx.insert(supplierTransactionApplications).values({
          tenantId,
          transactionId: newSupplierTransaction.id,
          accountsPayableId: dto.accountsPayableId,
          appliedAmount: dto.amount.toString(),
          applicationDate: new Date().toISOString(),
          createdById: userId,
        });

        const sum =
          Number(accountPayable[0].remainingAmount) + Number(dto.amount);

        await tx.update(accountsPayable).set({
          remainingAmount: sum.toString(),
          updatedById: userId,
        });
      }
      return newSupplierTransaction;
    });
  }

  async findAccountsPayableBySuppliers(
    supplierIds: string[],
    tenantId: string,
  ) {
    if (supplierIds.length === 0) {
      return [];
    }

    const data = await this.drizzle
      .select({
        id: accountsPayable.id,
        supplierId: suppliers.id,
        supplierName: suppliers.name,
        accountsPayableNumber: accountsPayable.accountsPayableNumber,
        supplierInvoiceId: accountsPayable.supplierInvoiceId,
        supplierInvoiceNumber: supplierInvoices.supplierInvoiceNumber,
        originalAmount: accountsPayable.originalAmount,
        paidAmount: accountsPayable.paidAmount,
        remainingAmount: accountsPayable.remainingAmount,
        status: accountsPayable.status,
        observations: accountsPayable.observations,
        dueDate: accountsPayable.dueDate,
        createdAt: accountsPayable.createdAt,
        invoiceNumber: supplierInvoices.invoiceNumber,
        isAuthorizePayment: accountsPayable.isAuthorizePayment,
      })
      .from(accountsPayable)
      .leftJoin(
        supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, supplierInvoices.id),
      )
      .leftJoin(suppliers, eq(accountsPayable.supplierId, suppliers.id))
      .where(
        and(
          eq(accountsPayable.tenantId, tenantId),
          inArray(accountsPayable.supplierId, supplierIds),
          or(
            eq(accountsPayable.status, 'PENDING'),
            eq(accountsPayable.status, 'PARTIALLY_PAID'),
          ),
          eq(accountsPayable.isAuthorizePayment, true),
        ),
      );

    return data;
  }

  async remove(id: string, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const accountPayable = await tx.query.accountsPayable.findFirst({
        where: and(
          eq(accountsPayable.id, id),
          eq(accountsPayable.tenantId, tenantId),
        ),
      });

      if (!accountPayable) {
        throw new NotFoundException('Account payable not found');
      }

      if (parseFloat(accountPayable.paidAmount) > 0) {
        throw new BadRequestException(
          'La CxP tiene pagos o transacciones activas.',
        );
      }

      const associatedTransactions = await tx
        .select()
        .from(supplierTransactionApplications)
        .where(eq(supplierTransactionApplications.accountsPayableId, id));

      if (associatedTransactions.length > 0) {
        throw new BadRequestException(
          'La CxP tiene pagos o transacciones aplicadas.',
        );
      }

      await tx
        .update(accountsPayable)
        .set({ status: 'CANCELLED', remainingAmount: '0.00' })
        .where(eq(accountsPayable.id, id));

      if (accountPayable.supplierInvoiceId) {
        await tx
          .update(supplierInvoices)
          .set({ status: 'CANCELLED' })
          .where(eq(supplierInvoices.id, accountPayable.supplierInvoiceId));

        const associatedInvoice = await tx.query.supplierInvoices.findFirst({
          where: eq(supplierInvoices.id, accountPayable.supplierInvoiceId),
        });

        if (associatedInvoice?.purchaseOrderId) {
          await tx
            .update(purchaseOrders)
            .set({ status: 'CANCELLED' })
            .where(eq(purchaseOrders.id, associatedInvoice.purchaseOrderId));
        }
      }

      return { message: 'Account payable cancelled successfully' };
    });
  }

  async getAppliedTransactions(accountsPayableId: string, tenantId: string) {
    return this.drizzle
      .select({
        id: supplierTransactions.id,
        transactionNumber: supplierTransactions.transactionNumber,
        transactionType: supplierTransactions.transactionType,
        amount: supplierTransactionApplications.appliedAmount,
        transactionDate: supplierTransactions.transactionDate,
        reference: supplierTransactions.observations,
      })
      .from(supplierTransactionApplications)
      .leftJoin(
        supplierTransactions,
        eq(
          supplierTransactionApplications.transactionId,
          supplierTransactions.id,
        ),
      )
      .where(
        and(
          eq(supplierTransactionApplications.tenantId, tenantId),
          eq(
            supplierTransactionApplications.accountsPayableId,
            accountsPayableId,
          ),
          ne(supplierTransactions.transactionType, 'PAYMENT'),
        ),
      );
  }

  async getAppliedTransaction(id: string, tenantId: string) {
    return this.drizzle
      .select({
        id: supplierTransactions.id,
        accounPayableRefence: accountsPayable.accountsPayableNumber,
        amountApplied: supplierTransactionApplications.appliedAmount,
      })
      .from(supplierTransactionApplications)
      .leftJoin(
        supplierTransactions,
        and(
          eq(supplierTransactions.id, id),
          eq(supplierTransactions.tenantId, tenantId),
        ),
      )
      .leftJoin(
        accountsPayable,
        eq(
          supplierTransactionApplications.accountsPayableId,
          accountsPayable.id,
        ),
      )
      .where(
        and(
          eq(supplierTransactionApplications.tenantId, tenantId),
          eq(supplierTransactionApplications.transactionId, id),
        ),
      );
  }

  async applyCreditNote(
    userId: string,
    accountsPayableId: string,
    dto: { creditNoteTransactionId: string; amount: number },
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [cxp] = await tx
        .select()
        .from(accountsPayable)
        .where(
          and(
            eq(accountsPayable.id, accountsPayableId),
            eq(accountsPayable.tenantId, tenantId),
          ),
        );

      if (!cxp) {
        throw new NotFoundException('Account payable not found');
      }

      if (cxp.status === 'PAID' || cxp.status === 'CANCELLED') {
        throw new BadRequestException(
          `Cannot apply credit note to ${cxp.status} account payable`,
        );
      }

      const [creditNote] = await tx
        .select()
        .from(supplierCreditNotes)
        .where(
          and(
            eq(supplierCreditNotes.transactionId, dto.creditNoteTransactionId),
            eq(supplierCreditNotes.tenantId, tenantId),
          ),
        );

      if (!creditNote) {
        throw new NotFoundException('Credit note not found');
      }

      const available = Number(creditNote.availableAmount);
      if (dto.amount > available) {
        throw new BadRequestException(
          `Amount (${dto.amount}) exceeds available credit (${available})`,
        );
      }

      const [transaction] = await tx
        .select()
        .from(supplierTransactions)
        .where(
          and(
            eq(supplierTransactions.id, dto.creditNoteTransactionId),
            eq(supplierTransactions.tenantId, tenantId),
            eq(supplierTransactions.transactionType, 'CREDIT_NOTE'),
          ),
        );

      if (!transaction) {
        throw new NotFoundException('Credit note transaction not found');
      }

      await tx.insert(supplierTransactionApplications).values({
        tenantId,
        transactionId: dto.creditNoteTransactionId,
        accountsPayableId: accountsPayableId,
        appliedAmount: dto.amount.toString(),
        applicationDate: new Date().toISOString(),
        createdById: userId,
      });

      const newAvailable = available - dto.amount;
      const newStatus = newAvailable <= 0.01 ? 'APPLIED' : 'PARTIALLY_APPLIED';

      await tx
        .update(supplierCreditNotes)
        .set({
          availableAmount: newAvailable.toString(),
          updatedById: userId,
        })
        .where(eq(supplierCreditNotes.transactionId, dto.creditNoteTransactionId));

      await tx
        .update(supplierTransactions)
        .set({ status: newStatus, updatedById: userId })
        .where(eq(supplierTransactions.id, dto.creditNoteTransactionId));

      const newRemaining = Number(cxp.remainingAmount) - dto.amount;
      const newPaid = Number(cxp.paidAmount) + dto.amount;
      const newCxpStatus = newRemaining <= 0.01 ? 'PAID' : 'PENDING';

      await tx
        .update(accountsPayable)
        .set({
          remainingAmount: newRemaining.toString(),
          paidAmount: newPaid.toString(),
          status: newCxpStatus,
          updatedById: userId,
        })
        .where(eq(accountsPayable.id, accountsPayableId));

      return {
        message: 'Credit note applied successfully',
        remainingAmount: newRemaining,
        appliedAmount: dto.amount,
      };
    });
  }

  async applyDebitNote(
    userId: string,
    accountsPayableId: string,
    dto: { debitNoteTransactionId: string; amount: number },
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [cxp] = await tx
        .select()
        .from(accountsPayable)
        .where(
          and(
            eq(accountsPayable.id, accountsPayableId),
            eq(accountsPayable.tenantId, tenantId),
          ),
        );

      if (!cxp) {
        throw new NotFoundException('Account payable not found');
      }

      if (cxp.status === 'PAID' || cxp.status === 'CANCELLED') {
        throw new BadRequestException(
          `Cannot apply debit note to ${cxp.status} account payable`,
        );
      }

      const [transaction] = await tx
        .select()
        .from(supplierTransactions)
        .where(
          and(
            eq(supplierTransactions.id, dto.debitNoteTransactionId),
            eq(supplierTransactions.tenantId, tenantId),
            eq(supplierTransactions.transactionType, 'DEBIT_NOTE'),
          ),
        );

      if (!transaction) {
        throw new NotFoundException('Debit note transaction not found');
      }

      const [existingApplication] = await tx
        .select()
        .from(supplierTransactionApplications)
        .where(
          and(
            eq(supplierTransactionApplications.transactionId, dto.debitNoteTransactionId),
            eq(supplierTransactionApplications.accountsPayableId, accountsPayableId),
          ),
        );

      if (existingApplication) {
        throw new BadRequestException(
          'Debit note already applied to this account payable',
        );
      }

      await tx.insert(supplierTransactionApplications).values({
        tenantId,
        transactionId: dto.debitNoteTransactionId,
        accountsPayableId: accountsPayableId,
        appliedAmount: dto.amount.toString(),
        applicationDate: new Date().toISOString(),
        createdById: userId,
      });

      const newRemaining = Number(cxp.remainingAmount) + dto.amount;

      await tx
        .update(accountsPayable)
        .set({
          remainingAmount: newRemaining.toString(),
          updatedById: userId,
        })
        .where(eq(accountsPayable.id, accountsPayableId));

      return {
        message: 'Debit note applied successfully',
        remainingAmount: newRemaining,
        appliedAmount: dto.amount,
      };
    });
  }

  async applyAdvance(
    userId: string,
    accountsPayableId: string,
    dto: { advanceTransactionId: string; amount: number },
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [cxp] = await tx
        .select()
        .from(accountsPayable)
        .where(
          and(
            eq(accountsPayable.id, accountsPayableId),
            eq(accountsPayable.tenantId, tenantId),
          ),
        );

      if (!cxp) {
        throw new NotFoundException('Account payable not found');
      }

      if (cxp.status === 'PAID' || cxp.status === 'CANCELLED') {
        throw new BadRequestException(
          `Cannot apply advance to ${cxp.status} account payable`,
        );
      }

      const [advance] = await tx
        .select()
        .from(supplierAdvances)
        .where(
          and(
            eq(supplierAdvances.transactionId, dto.advanceTransactionId),
            eq(supplierAdvances.tenantId, tenantId),
          ),
        );

      if (!advance) {
        throw new NotFoundException('Advance not found');
      }

      const available = Number(advance.availableAmount);
      if (dto.amount > available) {
        throw new BadRequestException(
          `Amount (${dto.amount}) exceeds available advance (${available})`,
        );
      }

      const [transaction] = await tx
        .select()
        .from(supplierTransactions)
        .where(
          and(
            eq(supplierTransactions.id, dto.advanceTransactionId),
            eq(supplierTransactions.tenantId, tenantId),
            eq(supplierTransactions.transactionType, 'ADVANCE'),
          ),
        );

      if (!transaction) {
        throw new NotFoundException('Advance transaction not found');
      }

      await tx.insert(supplierTransactionApplications).values({
        tenantId,
        transactionId: dto.advanceTransactionId,
        accountsPayableId: accountsPayableId,
        appliedAmount: dto.amount.toString(),
        applicationDate: new Date().toISOString(),
        createdById: userId,
      });

      const newAvailable = available - dto.amount;
      const newAdvanceStatus = newAvailable <= 0.01 ? 'APPLIED' : 'PARTIALLY_APPLIED';

      await tx
        .update(supplierAdvances)
        .set({
          availableAmount: newAvailable.toString(),
          statusPayment: newAvailable <= 0.01 ? 'PAID' : 'PENDING',
          updatedById: userId,
        })
        .where(eq(supplierAdvances.transactionId, dto.advanceTransactionId));

      await tx
        .update(supplierTransactions)
        .set({ status: newAdvanceStatus, updatedById: userId })
        .where(eq(supplierTransactions.id, dto.advanceTransactionId));

      const newRemaining = Number(cxp.remainingAmount) - dto.amount;
      const newPaid = Number(cxp.paidAmount) + dto.amount;
      const newCxpStatus = newRemaining <= 0.01 ? 'PAID' : 'PENDING';

      await tx
        .update(accountsPayable)
        .set({
          remainingAmount: newRemaining.toString(),
          paidAmount: newPaid.toString(),
          status: newCxpStatus,
          updatedById: userId,
        })
        .where(eq(accountsPayable.id, accountsPayableId));

      return {
        message: 'Advance applied successfully',
        remainingAmount: newRemaining,
        appliedAmount: dto.amount,
      };
    });
  }

  async unapplyTransaction(
    userId: string,
    accountsPayableId: string,
    applicationId: string,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [application] = await tx
        .select()
        .from(supplierTransactionApplications)
        .where(
          and(
            eq(supplierTransactionApplications.id, applicationId),
            eq(supplierTransactionApplications.tenantId, tenantId),
            eq(supplierTransactionApplications.accountsPayableId, accountsPayableId),
          ),
        );

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      const [transaction] = await tx
        .select()
        .from(supplierTransactions)
        .where(eq(supplierTransactions.id, application.transactionId));

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      const appliedAmount = Number(application.appliedAmount);

      if (transaction.transactionType === 'CREDIT_NOTE') {
        const [creditNote] = await tx
          .select()
          .from(supplierCreditNotes)
          .where(eq(supplierCreditNotes.transactionId, transaction.id));

        if (creditNote) {
          const newAvailable = Number(creditNote.availableAmount) + appliedAmount;
          await tx
            .update(supplierCreditNotes)
            .set({ availableAmount: newAvailable.toString(), updatedById: userId })
            .where(eq(supplierCreditNotes.transactionId, transaction.id));
        }

        await tx
          .update(accountsPayable)
          .set({
            remainingAmount: (
              Number(
                (await tx.select().from(accountsPayable).where(eq(accountsPayable.id, accountsPayableId)))[0]
                  .remainingAmount,
              ) + appliedAmount
            ).toString(),
            paidAmount: (
              Number(
                (await tx.select().from(accountsPayable).where(eq(accountsPayable.id, accountsPayableId)))[0]
                  .paidAmount,
              ) - appliedAmount
            ).toString(),
            updatedById: userId,
          })
          .where(eq(accountsPayable.id, accountsPayableId));

        await tx
          .update(supplierTransactions)
          .set({ status: 'ACTIVE', updatedById: userId })
          .where(eq(supplierTransactions.id, transaction.id));
      } else if (transaction.transactionType === 'ADVANCE') {
        const [advance] = await tx
          .select()
          .from(supplierAdvances)
          .where(eq(supplierAdvances.transactionId, transaction.id));

        if (advance) {
          const newAvailable = Number(advance.availableAmount) + appliedAmount;
          await tx
            .update(supplierAdvances)
            .set({ availableAmount: newAvailable.toString(), updatedById: userId })
            .where(eq(supplierAdvances.transactionId, transaction.id));
        }

        await tx
          .update(accountsPayable)
          .set({
            remainingAmount: (
              Number(
                (await tx.select().from(accountsPayable).where(eq(accountsPayable.id, accountsPayableId)))[0]
                  .remainingAmount,
              ) + appliedAmount
            ).toString(),
            paidAmount: (
              Number(
                (await tx.select().from(accountsPayable).where(eq(accountsPayable.id, accountsPayableId)))[0]
                  .paidAmount,
              ) - appliedAmount
            ).toString(),
            updatedById: userId,
          })
          .where(eq(accountsPayable.id, accountsPayableId));

        await tx
          .update(supplierTransactions)
          .set({ status: 'ACTIVE', updatedById: userId })
          .where(eq(supplierTransactions.id, transaction.id));
      } else if (transaction.transactionType === 'DEBIT_NOTE') {
        await tx
          .update(accountsPayable)
          .set({
            remainingAmount: (
              Number(
                (await tx.select().from(accountsPayable).where(eq(accountsPayable.id, accountsPayableId)))[0]
                  .remainingAmount,
              ) - appliedAmount
            ).toString(),
            updatedById: userId,
          })
          .where(eq(accountsPayable.id, accountsPayableId));
      }

      await tx
        .delete(supplierTransactionApplications)
        .where(eq(supplierTransactionApplications.id, applicationId));

      return { message: 'Application reverted successfully' };
    });
  }
}
