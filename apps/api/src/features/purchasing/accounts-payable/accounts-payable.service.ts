import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  accountsPayable,
  purchaseOrders,
  supplierAdvances,
  supplierCreditNotes,
  supplierDebitNotes,
  supplierInvoices,
  supplierTransactionApplications,
  supplierTransactions,
  suppliers,
} from '@/database/schema';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';

@Injectable()
export class AccountsPayableService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  async create(
    userId: string,
    data: any,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const supplier = await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.id, data.supplierId),
          eq(suppliers.status, 'ACTIVE'),
        ),
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
          await this.generateCodeService.generateNextReference('CXP', data.tenantId, 'purchasing', 'accounts-payable'),
        originalAmount: data.originalAmount.toString(),
        paidAmount: data.paidAmount?.toString() || '0.00',
        remainingAmount: data.remainingAmount.toString(),
        currencyCode: data.currencyCode || 'VES',
        status: data.status || 'PENDING',
        dueDate: data.dueDate
          ? (data.dueDate instanceof Date ? data.dueDate.toISOString() : String(data.dueDate))
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

    const searchConditions: SQL<unknown>[] = [eq(accountsPayable.tenantId, tenantId)];

    if (search) {
      searchConditions.push(ilike(accountsPayable.accountsPayableNumber, `%${search}%`));
    }
    if (supplierId) {
      searchConditions.push(eq(accountsPayable.supplierId, supplierId));
    }
    if (supplierInvoiceId) {
      searchConditions.push(eq(accountsPayable.supplierInvoiceId, supplierInvoiceId));
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
      .leftJoin(
        suppliers,
        eq(accountsPayable.supplierId, suppliers.id),
      )
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
      .select()
      .from(accountsPayable)
      .where(and(eq(accountsPayable.id, id), eq(accountsPayable.tenantId, tenantId)));

    if (!result) throw new NotFoundException('Account payable not found');
    return result;
  }

  async autorize(userId: string, id: string, tenantId: string) {
    const exist = await this.drizzle.query.accountsPayable.findFirst({
      where: and(eq(accountsPayable.id, id), eq(accountsPayable.tenantId, tenantId)),
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
      .set({ isAuthorizePayment: true, updatedById: userId })
      .where(and(eq(accountsPayable.id, id), eq(accountsPayable.tenantId, tenantId)))
      .returning();

    if (!updated) throw new NotFoundException('Account payable not found');
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
        await this.generateCodeService.generateNextReference('ADV-P', tenantId, 'purchasing', 'advances', tx);

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

      await tx
        .insert(supplierAdvances)
        .values({
          tenantId,
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
        await this.generateCodeService.generateNextReference(typeReference, tenantId, 'purchasing', 'transactions', tx);

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
            dto.observations ?? (dto.transactionType === 'CREDIT_NOTE'
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

  async findAccountsPayableBySuppliers(supplierIds: string[], tenantId: string) {
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
            eq(accountsPayable.status, 'IN_PROGRESS'),
            eq(accountsPayable.status, 'EXPIRED'),
          ),
          eq(accountsPayable.isAuthorizePayment, true),
        ),
      );

    return data;
  }

  async remove(id: string, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const accountPayable = await tx.query.accountsPayable.findFirst({
        where: and(eq(accountsPayable.id, id), eq(accountsPayable.tenantId, tenantId)),
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
      .leftJoin(supplierTransactions, and(
        eq(supplierTransactions.id, id),
        eq(supplierTransactions.tenantId, tenantId),
      ))
      .leftJoin(
        accountsPayable,
        eq(
          supplierTransactionApplications.accountsPayableId,
          accountsPayable.id,
        ),
      )
      .where(and(
        eq(supplierTransactionApplications.tenantId, tenantId),
        eq(supplierTransactionApplications.transactionId, id),
      ));
  }
}
