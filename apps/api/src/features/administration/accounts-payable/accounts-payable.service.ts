import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  accountsPayable,
  supplierAdvances,
  supplierCreditNotes,
  supplierDebitNotes,
  supplierInvoices,
  suppliers,
  supplierTransactionApplications,
  supplierTransactions,
} from '@/database/schema/administration';
import { paymentAccountsPayableEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateAccountPayableDto } from './dto/create-account-payable.dto';
import { CreateAdvanceSupplierDto } from './dto/create-advance-supplierdto';
import { CreateSupplierTransactionDto } from './dto/create-supplier-transaction.dto';
import { FilterAccountPayableDto } from './dto/filter-account-payable.dto';

@Injectable()
export class AccountsPayableService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  //metodo para crear una cuenta por pagar se utiliza principalmente al contabilizar una factura de proveedor
  async create(
    userId: number,
    data: CreateAccountPayableDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const supplier = await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.id, Number(data.supplierId)),
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
        ...data,
        companyId: Number(supplier[0].companyId),
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

    console.log('newAccountPayable', newAccountPayable);

    return newAccountPayable[0];
  }

  //metodo de consulta de las cuenta por pagar
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
      isAuthorizePayment,
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

    if (isAuthorizePayment) {
      searchConditions.push(
        eq(
          accountsPayable.isAuthorizePayment,
          isAuthorizePayment === 'true' ? true : false,
        ),
      );
    }

    if (status) {
      let parsedSupplierStatus: paymentAccountsPayableEnum[] = [];
      if (Array.isArray(status)) {
        if (status.length === 1 && status[0].includes(',')) {
          // Si es un array con un string con comas, separar
          parsedSupplierStatus = status[0].split(
            ',',
          ) as paymentAccountsPayableEnum[];
        } else {
          parsedSupplierStatus = status as paymentAccountsPayableEnum[];
        }
      } else if (typeof status === 'string') {
        parsedSupplierStatus = status.split(
          ',',
        ) as paymentAccountsPayableEnum[];
      }

      // Ahora pasamos array limpio a inArray (o al filtro manual con OR)
      if (parsedSupplierStatus.length > 0) {
        searchConditions.push(
          inArray(schema.accountsPayable.status, parsedSupplierStatus),
        );
      }
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
        supplierInvoiceNumber: schema.supplierInvoices.supplierInvoiceNumber,
        originalAmount: schema.accountsPayable.originalAmount,
        paidAmount: schema.accountsPayable.paidAmount,
        remainingAmount: schema.accountsPayable.remainingAmount,
        status: schema.accountsPayable.status,
        observations: schema.accountsPayable.observations,
        dueDate: schema.accountsPayable.dueDate,
        createdAt: schema.accountsPayable.createdAt,
        isAuthorizePayment: schema.accountsPayable.isAuthorizePayment,
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

  //meotod para autorizar el pago de una cuenta por pagar
  async autorize(userId: number, id: number) {
    const exist = await this.drizzle.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Account payable not found');
    }

    if (exist.status !== 'PENDING') {
      throw new BadRequestException(
        'The account payable is already authorized for payment',
      );
    }
    await this.drizzle
      .update(accountsPayable)
      .set({
        isAuthorizePayment: true,
        updatedById: userId,
      })
      .where(eq(accountsPayable.id, id));
  }

  //metodo para crear anticipos
  async createAdvanceSupplier(dto: CreateAdvanceSupplierDto, userId: number) {
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
        await this.generateCodeService.generateNextReference('ADV-P', tx);

      const [newSupplierTransaction] = await tx
        .insert(supplierTransactions)
        .values({
          companyId: Number(supplier[0].companyId),
          supplierId: dto.supplierId,
          transactionNumber: supplierAdvanceNumber,
          transactionType: 'ADVANCE',
          transactionDate: new Date().toISOString(),
          amount: dto.amount.toString(),
          currencyCode: 'VES',
          status: 'ACTIVE',
          observations: dto.observations ?? `ANTICIPO A PROVEEDOR`,
          createdById: userId,
        })
        .returning({
          id: schema.supplierTransactions.id,
          transactionNumber: schema.supplierTransactions.transactionNumber,
          transactionType: schema.supplierTransactions.transactionType,
          transactionDate: schema.supplierTransactions.transactionDate,
          amount: schema.supplierTransactions.amount,
          currencyCode: schema.supplierTransactions.currencyCode,
          status: schema.supplierTransactions.status,
          observations: schema.supplierTransactions.observations,
          createdById: schema.supplierTransactions.createdById,
        });

      await tx
        .insert(supplierAdvances)
        .values({
          transactionId: newSupplierTransaction.id,
          supplierId: dto.supplierId,
          amount: dto.amount.toString(),
          availableAmount: dto.amount.toString(),
          createdById: userId,
        })
        .returning({
          id: schema.supplierAdvances.id,
          transactionId: schema.supplierAdvances.transactionId,
          supplierId: schema.supplierAdvances.supplierId,
          amount: schema.supplierAdvances.amount,
          availableAmount: schema.supplierAdvances.availableAmount,
          createdById: schema.supplierAdvances.createdById,
        });

      return newSupplierTransaction;
    });
  }

  //metodo apra crear notas debito o credito
  async createCreditDebitNote(
    userId: number,
    dto: CreateSupplierTransactionDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const supplier = await this.drizzle
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
        await this.generateCodeService.generateNextReference(typeReference, tx);

      const [newSupplierTransaction] = await tx
        .insert(supplierTransactions)
        .values({
          companyId: Number(supplier[0].companyId),
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
            (dto.observations ?? dto.transactionType === 'CREDIT_NOTE')
              ? `NOTA DE CRÉDITO A PROVEEDOR`
              : `NOTA DE DÉDITO A PROVEEDOR`,
          createdById: userId,
        })
        .returning({
          id: schema.supplierTransactions.id,
          transactionNumber: schema.supplierTransactions.transactionNumber,
          transactionType: schema.supplierTransactions.transactionType,
          transactionDate: schema.supplierTransactions.transactionDate,
          amount: schema.supplierTransactions.amount,
          currencyCode: schema.supplierTransactions.currencyCode,
          status: schema.supplierTransactions.status,
          observations: schema.supplierTransactions.observations,
          createdById: schema.supplierTransactions.createdById,
        });

      if (dto.transactionType === 'CREDIT_NOTE') {
        await tx.insert(supplierCreditNotes).values({
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
          .where(eq(accountsPayable.id, Number(dto.accountsPayableId)));

        await tx.insert(supplierDebitNotes).values({
          transactionId: newSupplierTransaction.id,
          supplierId: dto.supplierId,
          accountsPayableId: Number(dto.accountsPayableId),
          debitNoteNumber: referenceNumber,
          reason: dto.reason,
          amount: dto.amount.toString(),
          createdById: userId,
        });

        await tx.insert(supplierTransactionApplications).values({
          transactionId: newSupplierTransaction.id,
          accountsPayableId: Number(dto.accountsPayableId),
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

  ///revisar quien la usa
  async findAccountsPayableBySuppliers(supplierIds: number[]) {
    //REVISAR QUIEN LO USA
    // Manejar el caso de un arreglo vacío
    if (supplierIds.length === 0) {
      return [];
    }

    const data = await this.drizzle
      .select({
        id: schema.accountsPayable.id,
        supplierId: schema.suppliers.id,
        supplierName: schema.suppliers.name,
        accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        supplierInvoiceId: schema.accountsPayable.supplierInvoiceId,
        supplierInvoiceNumber: schema.supplierInvoices.supplierInvoiceNumber,
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
        isAuthorizePayment: schema.accountsPayable.isAuthorizePayment,
      })
      .from(accountsPayable)
      .leftJoin(
        supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, supplierInvoices.id),
      )
      .leftJoin(suppliers, eq(accountsPayable.supplierId, suppliers.id))
      .where(
        and(
          inArray(accountsPayable.supplierId, supplierIds),
          or(
            eq(accountsPayable.status, 'PENDING'),
            eq(accountsPayable.status, 'IN_PROGRESS'),
            eq(accountsPayable.status, 'EXPIRED'),
          ),
          eq(accountsPayable.isAuthorizePayment, true),
        ),
      );

    // La validación de "not found" no es necesaria aquí, ya que devolver un arreglo vacío es el comportamiento esperado si no se encuentran resultados.
    // La lógica para lanzar un error debe manejarse en un nivel superior si es un caso de uso específico.

    return data;
  }

  async remove(id: number) {
    return this.drizzle.transaction(async (tx) => {
      const accountPayable = await tx.query.accountsPayable.findFirst({
        where: eq(accountsPayable.id, id),
      });

      if (!accountPayable) {
        throw new NotFoundException('Account payable not found');
      }

      // 1. Validation
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

      // 2. Update Account Payable
      await tx
        .update(accountsPayable)
        .set({ status: 'CANCELLED', remainingAmount: '0.00' })
        .where(eq(accountsPayable.id, id));

      // 3. Update Associated Invoice
      if (accountPayable.supplierInvoiceId) {
        await tx
          .update(supplierInvoices)
          .set({ status: 'CANCELLED' })
          .where(eq(supplierInvoices.id, accountPayable.supplierInvoiceId));

        // 4. Update Associated Purchase Order (if applicable)
        const associatedInvoice = await tx.query.supplierInvoices.findFirst({
          where: eq(supplierInvoices.id, accountPayable.supplierInvoiceId),
        });

        if (associatedInvoice?.purchaseOrderId) {
          await tx
            .update(schema.purchaseOrders)
            .set({ status: 'CANCELLED' })
            .where(eq(supplierInvoices.id, schema.purchaseOrders.id));
        }
      }

      return { message: 'Account payable cancelled successfully' };
    });
  }

  //metodo para listar las transacciones aplicadas a una cuenta por pagar (anticipos, notas credito/debito)
  async getAppliedTransactions(accountsPayableId: number) {
    return this.drizzle
      .select({
        id: schema.supplierTransactions.id,
        transactionNumber: schema.supplierTransactions.transactionNumber,
        transactionType: schema.supplierTransactions.transactionType,
        amount: schema.supplierTransactionApplications.appliedAmount,
        transactionDate: schema.supplierTransactions.transactionDate,
        reference: schema.supplierTransactions.observations,
      })
      .from(schema.supplierTransactionApplications)
      .leftJoin(
        schema.supplierTransactions,
        eq(
          schema.supplierTransactionApplications.transactionId,
          schema.supplierTransactions.id,
        ),
      )
      .where(
        and(
          eq(
            schema.supplierTransactionApplications.accountsPayableId,
            accountsPayableId,
          ),
          ne(schema.supplierTransactions.transactionType, 'PAYMENT'),
        ),
      );
  }

  async getAppliedTransaction(id: number) {
    return this.drizzle
      .select({
        id: supplierTransactions.id,
        accounPayableRefence: accountsPayable.accountsPayableNumber,
        amountApplied: supplierTransactionApplications.appliedAmount,
      })
      .from(supplierTransactionApplications)
      .leftJoin(supplierTransactions, eq(supplierTransactions.id, id))
      .leftJoin(
        accountsPayable,
        eq(
          supplierTransactionApplications.accountsPayableId,
          accountsPayable.id,
        ),
      )
      .where(eq(supplierTransactionApplications.transactionId, id));
  }
}
