import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  accountsPayable,
  supplierInvoices,
  suppliers,
  supplierTransactions,
} from '@/database/schema/administration';
import { paymentAccountsPayableEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, or, sql, SQL } from 'drizzle-orm';
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

  //metodo apra crear notas debito o credito
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
        transactionDate: new Date().toISOString(),
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

  //metodo para crear una cuenta por pagar
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

  // async update(userId: number, id: number, data: UpdateAccountPayableDto) {
  //   const exist = await this.drizzle.query.accountsPayable.findFirst({
  //     where: eq(accountsPayable.id, id),
  //   });

  //   if (!exist) {
  //     throw new NotFoundException('Account payable not found');
  //   }

  //   const updatedAccountPayable = await this.drizzle
  //     .update(accountsPayable)
  //     .set({
  //       ...data,
  //       originalAmount: data.originalAmount?.toString(),
  //       paidAmount: data.paidAmount?.toString(),
  //       remainingAmount: data.remainingAmount?.toString(),
  //       dueDate: data.dueDate?.toISOString() || null,
  //       updatedById: userId,
  //     })
  //     .where(eq(accountsPayable.id, id))
  //     .returning();

  //   return updatedAccountPayable[0];
  // }

  //meotod para autorizar el pago de una cuenta por pagar
  async autorize(userId: number, id: number) {
    const exist = await this.drizzle.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Account payable not found');
    }

    if (exist.status === 'PENDING') {
      await this.drizzle
        .update(accountsPayable)
        .set({
          isAuthorizePayment: true,
          updatedById: userId,
        })
        .where(eq(accountsPayable.id, id));
    } else if (exist.status === 'ADVANCE') {
      await this.drizzle
        .update(accountsPayable)
        .set({
          isAuthorizePayment: true,
          updatedById: userId,
        })
        .where(eq(accountsPayable.id, id));
    }
  }

  //metodo para crear anticipos
  async createAdvanceSupplier(dto: CreateAdvanceSupplierDto, userId: number) {
    return this.drizzle.transaction(async (tx) => {
      // 1. Crear la cuenta por pagar con saldo negativo y estado ADVANCE
      const accountsPayableNumber =
        await this.generateCodeService.generateNextReference('ADV-P', tx);
      const [newAccountPayable] = await tx
        .insert(schema.accountsPayable)
        .values({
          supplierId: dto.supplierId,
          accountsPayableNumber: accountsPayableNumber,
          originalAmount: (dto.amount * -1).toString(), // Saldo negativo
          paidAmount: '0.00',
          remainingAmount: (dto.amount * -1).toString(), // Saldo negativo
          currencyCode: 'VES',
          status: paymentAccountsPayableEnum.ADVANCE,
          observations:
            dto.observations ?? `ANTICIPO A PROVEEDOR ${accountsPayableNumber}`,
          createdById: userId,
          dueDate: null, // Fecha actual para anticipos
        })
        .returning({
          id: schema.accountsPayable.id,
          supplierId: schema.accountsPayable.supplierId,
          totalAmount: schema.accountsPayable.remainingAmount,
          currencyCode: schema.accountsPayable.currencyCode,
          status: schema.accountsPayable.status,
          observations: schema.accountsPayable.observations,
          transactionDate: schema.accountsPayable.createdAt,
          isAuthorizePayment: schema.accountsPayable.isAuthorizePayment,
        });

      return newAccountPayable;
    });
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

  //VERFICIAR SI HACE FALTA SI NO ELIMINAR
  // async getPreloadedPaymentData(id: number) {
  //   const [result] = await this.drizzle
  //     .select({
  //       supplierId: schema.supplierInvoices.supplierId,
  //       chargePayment: schema.supplierInvoices.chargePayment,
  //       bankAccountId: schema.supplierInvoices.bankAccountId,
  //       paymentDescription: schema.supplierInvoices.paymentDescription,
  //       paymentMethod: schema.supplierInvoices.paymentMethod,
  //       bankReference: schema.supplierInvoices.paymentBankReference,
  //       transactionDate: schema.supplierInvoices.transactionDate,
  //       amount: accountsPayable.remainingAmount, // Precargar el monto restante
  //     })
  //     .from(accountsPayable)
  //     .leftJoin(
  //       schema.supplierInvoices,
  //       eq(accountsPayable.supplierInvoiceId, schema.supplierInvoices.id),
  //     )
  //     .where(eq(accountsPayable.id, id));

  //   if (!result.chargePayment) {
  //     return null; // No hay datos que precargar
  //   }

  //   return {
  //     supplierId: result.supplierId,
  //     bankAccountId: result.bankAccountId,
  //     paymentDescription: result.paymentDescription,
  //     paymentMethod: result.paymentMethod,
  //     bankReference: result.bankReference,
  //     transactionDate: result.transactionDate,
  //     amount: result.amount, // Precargar el monto restante
  //   };
  // }

  async updateBalances(
    data: {
      accountsPayableId: number | null;
      amount: string | number;
      description?: string;
      relatedAdvanceId?: number | null;
    }[],
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.drizzle;

    const accountsPayableIds = data
      .map((item) => item.accountsPayableId)
      .filter(Boolean) as number[];
    const uniqueAccountsIds = [...new Set(accountsPayableIds)];

    if (uniqueAccountsIds.length === 0) return new Map();

    // Obtener las cuentas por pagar que se van a tocar
    const accountsToUpdate = await db
      .select({
        id: accountsPayable.id,
        remainingAmount: accountsPayable.remainingAmount,
        paidAmount: accountsPayable.paidAmount,
        supplierInvoiceId: accountsPayable.supplierInvoiceId,
        status: accountsPayable.status,
        accountsPayableNumber: accountsPayable.accountsPayableNumber,
      })
      .from(accountsPayable)
      .where(inArray(accountsPayable.id, uniqueAccountsIds));

    if (!accountsToUpdate.length) {
      throw new NotFoundException('Cuentas por pagar no encontradas.');
    }

    const accountsMap = new Map(accountsToUpdate.map((ap) => [ap.id, ap]));

    // Prepara helper maps
    const isAdvanceById = new Map<number, boolean>();
    for (const [id, ap] of accountsMap.entries()) {
      isAdvanceById.set(
        id,
        String(ap.accountsPayableNumber).startsWith('ADV-P'),
      );
    }

    // Map de resultados que devolvemos
    const updates = new Map<
      number,
      {
        newPaidAmount: number;
        newRemainingAmount: number;
        invoiceId: number | null;
        status: string;
        isAdvance: boolean;
      }
    >();

    // 1) Normalizar: si el payload contiene una línea "aplicación" donde accountsPayableId apunta al anticipo
    //    pero la intención es aplicarlo a una factura, detectamos la factura objetivo (si hay exactamente 1 factura en payload).
    //    Si no hay coincidencia clara, esperamos que el frontend mande accountsPayableId = invoiceId y relatedAdvanceId = advanceId.
    const invoiceLines = data.filter((d) => {
      const ap = accountsMap.get(d.accountsPayableId as number);
      return ap && !String(ap.accountsPayableNumber).startsWith('ADV-P');
    });

    for (const item of data) {
      const id = item.accountsPayableId as number;
      const account = accountsMap.get(id);
      if (!account) continue;

      const paymentAmount = Number(item.amount);
      const currentPaid = Number(account.paidAmount) || 0;
      const currentRemaining = Number(account.remainingAmount) || 0;
      const isAdvance = isAdvanceById.get(id) ?? false;

      // Caso: línea que aplica anticipo a factura
      const hasRelatedAdvance = item.relatedAdvanceId != null;

      // If this line is for a non-advance (invoice):
      if (!isAdvance) {
        // Sum any advance application amounts that are intended for this invoice.
        // Two possible payload shapes:
        //  A) The application is represented as a separate line that points to the invoice and has relatedAdvanceId.
        //  B) The application is represented as a line that points to the advance (we try to infer the target invoice).
        let totalAppliedFromAdvancesToThisInvoice = 0;

        // A) same-line application to this invoice:
        if (hasRelatedAdvance) {
          totalAppliedFromAdvancesToThisInvoice += paymentAmount;
        }

        // B) find application lines that point to an advance but should apply to this invoice.
        //    Heurística: application-line where accountsPayableId is an advance id and there's exactly one invoice line overall.
        for (const possible of data) {
          const pid = possible.accountsPayableId as number;
          if (!pid) continue;
          const possibleAp = accountsMap.get(pid);
          if (!possibleAp) continue;
          const possibleIsAdvance = String(
            possibleAp.accountsPayableNumber,
          ).startsWith('ADV-P');
          if (!possibleIsAdvance) continue;
          // possible is an advance-line; if it has relatedAdvanceId (meaning it's an application) and
          // the frontend used the 'advance-line' style (accountsPayableId = advanceId), then we need to attribute
          // this amount to the invoice. We only do this when we can unambiguously find the invoice target.
          if (possible.relatedAdvanceId != null) {
            // If this `item` is the single invoice line (or specifically the intended invoice),
            // we add the advance amount to it. Heuristics: if there's only one invoice line in payload,
            // consider it the target.
            if (invoiceLines.length === 1) {
              totalAppliedFromAdvancesToThisInvoice += Number(possible.amount);
            }
            // else: if there are multiple invoices, the frontend must send the application as accountsPayableId = invoiceId
            // and relatedAdvanceId = advanceId. If not, we cannot guess — throw.
          }
        }

        const newPaidAmount =
          currentPaid +
          Number(item.amount) +
          totalAppliedFromAdvancesToThisInvoice;
        const newRemainingAmount =
          currentRemaining -
          (Number(item.amount) + totalAppliedFromAdvancesToThisInvoice);

        if (newRemainingAmount < 0) {
          throw new BadRequestException(
            'El monto del pago excede el saldo restante de la factura.',
          );
        }

        updates.set(id, {
          newPaidAmount,
          newRemainingAmount,
          invoiceId: (account.supplierInvoiceId as number) ?? null,
          status: newRemainingAmount === 0 ? 'PAID' : 'IN_PROGRESS',
          isAdvance: false,
        });
      } else {
        // isAdvance === true (es un anticipo)
        // Debemos ver si la línea representa:
        //  - Pago directo del anticipo (no relatedAdvanceId) => marcar PAID, no tocar montos
        //  - Aplicación del anticipo a una factura (relatedAdvanceId present) => reducir anticipo remaining y setear status
        const isDirectAdvancePayment =
          !hasRelatedAdvance && !data.some((d) => d.relatedAdvanceId === id);
        // Explanation: if no relatedAdvanceId on this line and no other line references this advance as relatedAdvanceId,
        // consider it a direct payment of the advance (tesorería). Otherwise it's an application.

        if (isDirectAdvancePayment) {
          // pago directo: no tocar montos, solo marcar PAID (si corresponde)
          updates.set(id, {
            newPaidAmount: currentPaid,
            newRemainingAmount: currentRemaining,
            invoiceId: (account.supplierInvoiceId as number) ?? null,
            status: 'PAID',
            isAdvance: true,
          });
        } else {
          // Aplicación del anticipo: el payload debe indicarnos cuánto se aplica (paymentAmount).
          // currentRemaining es negativo (modelo de anticipos), al aplicar sumamos paymentAmount.
          const newRemainingAmount = currentRemaining + paymentAmount; // ej: -2500 + 2500 = 0
          const newPaidAmount = currentPaid; // según tu política
          const newStatus =
            newRemainingAmount === 0 ? 'ADVANCE_APPLIED' : 'ADVANCE_PARTIAL';

          updates.set(id, {
            newPaidAmount,
            newRemainingAmount,
            invoiceId: (account.supplierInvoiceId as number) ?? null,
            status: newStatus,
            isAdvance: true,
          });
        }
      }
    } // end for

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
    console.log(data);

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
        .from(supplierTransactions)
        .where(
          and(
            eq(supplierTransactions.accountsPayableId, id),
            // Assuming "active" means not cancelled/reversed.
            // If supplierTransactions has a status field, it should be checked here.
            // For now, just checking for existence.
          ),
        );

      if (associatedTransactions.length > 0) {
        throw new BadRequestException(
          'La CxP tiene pagos o transacciones activas.',
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
}
