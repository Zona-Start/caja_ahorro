import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import { apPayments, accountsPayable } from '@/database/schema/accounts-payable';
import { CreateApPaymentDto } from '../dto/create-ap-payment.dto';
import { UpdateApPaymentDto } from '../dto/update-ap-payment.dto';
import { FilterApPaymentDto } from '../dto/filter-ap-payment.dto';
import { and, eq, ilike, sql, SQL, gte, lte } from 'drizzle-orm';
import { ApPayment } from '../entities/ap-payment.entity';
import { PaymentSuppliersStatusEnum, InvoiceSuppliersStatusEnum } from '@/types/enum';

@Injectable()
export class ApPaymentsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, createApPaymentDto: CreateApPaymentDto): Promise<ApPayment> {
    return this.drizzle.transaction(async (tx) => {
      const invoice = await tx.query.accountsPayable.findFirst({
        where: eq(accountsPayable.id, createApPaymentDto.payableId),
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID '${createApPaymentDto.payableId}' not found.`);
      }

      const amountPaidNum = createApPaymentDto.amountPaid;
      const currentPaidAmountNum = Number(invoice.paidAmount);
      const currentRemainingAmountNum = Number(invoice.remainingAmount);

      if (amountPaidNum > currentRemainingAmountNum) {
        throw new BadRequestException(
          `Amount paid '${amountPaidNum}' exceeds remaining amount '${currentRemainingAmountNum}' for invoice ID '${createApPaymentDto.payableId}'.`,
        );
      }

      const newPaidAmount = currentPaidAmountNum + amountPaidNum;
      const newRemainingAmount = currentRemainingAmountNum - amountPaidNum;

      let newInvoiceStatus: InvoiceSuppliersStatusEnum;
      if (newRemainingAmount <= 0) {
        newInvoiceStatus = InvoiceSuppliersStatusEnum.PAID;
      } else if (newPaidAmount > 0) {
        newInvoiceStatus = InvoiceSuppliersStatusEnum.PARTIALLY_PAID;
      } else {
        newInvoiceStatus = InvoiceSuppliersStatusEnum.PENDING;
      }

      const [newPayment] = await tx.insert(apPayments).values({
        ...createApPaymentDto,
        paymentDate: createApPaymentDto.paymentDate.toISOString().split('T')[0],
        amountPaid: amountPaidNum.toString(),
        status: createApPaymentDto.status ?? PaymentSuppliersStatusEnum.PROCESSED,
        isReversed: createApPaymentDto.isReversed ?? false,
        createdById: userId,
      }).returning();

      await tx.update(accountsPayable).set({
        paidAmount: newPaidAmount.toString(),
        remainingAmount: newRemainingAmount.toString(),
        status: newInvoiceStatus,
        updatedById: userId,
      }).where(eq(accountsPayable.id, createApPaymentDto.payableId));

      return newPayment;
    });
  }

  async findAll(filterDto: FilterApPaymentDto): Promise<{ data: ApPayment[]; meta: any }> {
    const { page = 1, limit = 10, search = '', sortBy = 'id', sortOrder = 'asc',
      payableId, paymentDateStart, paymentDateEnd, paymentMethod, transactionReference, status
    } = filterDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(apPayments.transactionReference, `%${search}%`));
      searchConditions.push(ilike(apPayments.observations, `%${search}%`));
    }
    if (payableId) {
      searchConditions.push(eq(apPayments.payableId, payableId));
    }
    if (paymentDateStart) {
      searchConditions.push(gte(apPayments.paymentDate, paymentDateStart.toISOString().split('T')[0]));
    }
    if (paymentDateEnd) {
      searchConditions.push(lte(apPayments.paymentDate, paymentDateEnd.toISOString().split('T')[0]));
    }
    if (paymentMethod) {
      searchConditions.push(eq(apPayments.paymentMethod, paymentMethod));
    }
    if (transactionReference) {
      searchConditions.push(ilike(apPayments.transactionReference, `%${transactionReference}%`));
    }
    if (status) {
      searchConditions.push(eq(apPayments.status, status));
    }

    const finalCondition = searchConditions.length ? and(...searchConditions) : undefined;

    const orderBy = sortOrder === 'asc'
      ? sql`${apPayments[sortBy as keyof typeof apPayments]} asc`
      : sql`${apPayments[sortBy as keyof typeof apPayments]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(apPayments)
      .where(finalCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.drizzle.query.apPayments.findMany({
      where: finalCondition,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
    });

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

    return {
      data: data.map(payment => ({
        ...payment,
        paymentDate: new Date(payment.paymentDate),
        amountPaid: Number(payment.amountPaid),
        isReversed: Boolean(payment.isReversed),
      })) as ApPayment[],
      meta
    };
  }

  async findOne(id: number): Promise<ApPayment> {
    const payment = await this.drizzle.query.apPayments.findFirst({
      where: eq(apPayments.id, id),
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID '${id}' not found.`);
    }

    return {
      ...payment,
      paymentDate: new Date(payment.paymentDate),
      amountPaid: Number(payment.amountPaid),
      isReversed: Boolean(payment.isReversed),
    } as ApPayment;
  }

  async update(userId: number, id: number, updateApPaymentDto: UpdateApPaymentDto): Promise<ApPayment> {
    const existingPayment = await this.findOne(id);

    if (existingPayment.isReversed) {
      throw new BadRequestException(`Cannot update a reversed payment.`);
    }

    return this.drizzle.transaction(async (tx) => {
      const invoice = await tx.query.accountsPayable.findFirst({
        where: eq(accountsPayable.id, existingPayment.payableId),
      });

      if (!invoice) {
        throw new NotFoundException(`Associated invoice with ID '${existingPayment.payableId}' not found.`);
      }

      const oldAmountPaid = Number(existingPayment.amountPaid);
      const newAmountPaid = updateApPaymentDto.amountPaid ?? oldAmountPaid;

      const invoiceCurrentPaidAmount = Number(invoice.paidAmount);
      const invoiceCurrentRemainingAmount = Number(invoice.remainingAmount);

      // Revert old payment's effect on invoice
      const tempPaidAmount = invoiceCurrentPaidAmount - oldAmountPaid;
      const tempRemainingAmount = invoiceCurrentRemainingAmount + oldAmountPaid;

      // Apply new payment's effect on invoice
      const finalPaidAmount = tempPaidAmount + newAmountPaid;
      const finalRemainingAmount = tempRemainingAmount - newAmountPaid;

      let newInvoiceStatus: InvoiceSuppliersStatusEnum;
      if (finalRemainingAmount <= 0) {
        newInvoiceStatus = InvoiceSuppliersStatusStatusEnum.PAID;
      } else if (finalPaidAmount > 0) {
        newInvoiceStatus = InvoiceSuppliersStatusEnum.PARTIALLY_PAID;
      } else {
        newInvoiceStatus = InvoiceSuppliersStatusEnum.PENDING;
      }

      const [updatedPayment] = await tx.update(apPayments).set({
        ...updateApPaymentDto,
        paymentDate: updateApPaymentDto.paymentDate ? updateApPaymentDto.paymentDate.toISOString().split('T')[0] : undefined,
        amountPaid: newAmountPaid.toString(),
        updatedById: userId,
      }).where(eq(apPayments.id, id)).returning();

      await tx.update(accountsPayable).set({
        paidAmount: finalPaidAmount.toString(),
        remainingAmount: finalRemainingAmount.toString(),
        status: newInvoiceStatus,
        updatedById: userId,
      }).where(eq(accountsPayable.id, existingPayment.payableId));

      return updatedPayment;
    });
  }

  async remove(userId: number, id: number): Promise<{ message: string }> {
    const existingPayment = await this.findOne(id);

    if (existingPayment.isReversed) {
      throw new BadRequestException(`Payment with ID '${id}' is already reversed.`);
    }

    return this.drizzle.transaction(async (tx) => {
      const invoice = await tx.query.accountsPayable.findFirst({
        where: eq(accountsPayable.id, existingPayment.payableId),
      });

      if (!invoice) {
        throw new NotFoundException(`Associated invoice with ID '${existingPayment.payableId}' not found.`);
      }

      const paymentAmount = Number(existingPayment.amountPaid);
      const invoiceCurrentPaidAmount = Number(invoice.paidAmount);
      const invoiceCurrentRemainingAmount = Number(invoice.remainingAmount);

      const newInvoicePaidAmount = invoiceCurrentPaidAmount - paymentAmount;
      const newInvoiceRemainingAmount = invoiceCurrentRemainingAmount + paymentAmount;

      let newInvoiceStatus: InvoiceSuppliersStatusEnum;
      if (newInvoicePaidAmount <= 0) {
        newInvoiceStatus = InvoiceSuppliersStatusEnum.PENDING;
      } else {
        newInvoiceStatus = InvoiceSuppliersStatusEnum.PARTIALLY_PAID;
      }

      await tx.update(accountsPayable).set({
        paidAmount: newInvoicePaidAmount.toString(),
        remainingAmount: newInvoiceRemainingAmount.toString(),
        status: newInvoiceStatus,
        updatedById: userId,
      }).where(eq(accountsPayable.id, existingPayment.payableId));

      await tx.update(apPayments).set({
        isReversed: true,
        status: PaymentSuppliersStatusEnum.REVERSED,
        updatedById: userId,
      }).where(eq(apPayments.id, id));

      return { message: `Payment with ID '${id}' reversed successfully.` };
    });
  }
}
