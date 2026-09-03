import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associates,
  bankAccounts,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loans,
  loanTypes,
} from '@/database/schema';
import {
  loanPaymetTypeEnum,
  LoanStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { and, eq, ilike, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { LoanPaymentProcessor } from './domain/loan-payment.processor';
import { LoanPaymentValidator } from './domain/loan-payment.validator';
import { CreateLoanPaidDto, FilterLoanPaidDto } from './dto/loan-paid.schema';
import { BulkPaymentUseCase } from './use-cases/bulk-payment.usecase';
import { CancelPaymentUseCase } from './use-cases/cancel-payment.usecase';
import { CreatePaymentUseCase } from './use-cases/create-payment.usecase';

@Injectable()
export class LoanPaidService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly validator: LoanPaymentValidator,
    private readonly processor: LoanPaymentProcessor,
    private readonly createPayment: CreatePaymentUseCase,
    private readonly bulkPayment: BulkPaymentUseCase,
    private readonly cancelPayment: CancelPaymentUseCase,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateLoanPaidDto,
    tx?: NodePgDatabase<typeof schema>,
    liquidationActive?: boolean,
  ) {
    return this.createPayment.execute(
      tenantId,
      userId,
      dto,
      tx,
      liquidationActive,
    );
  }

  async downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla de Pagos');

    worksheet.columns = [
      { key: 'a', width: 20 },
      { key: 'b', width: 18 },
    ];

    // Fila 1: fecha de pago (aplica a todos los pagos)
    worksheet.getCell('A1').value = 'fecha';
    worksheet.getCell('B1').value = format(new Date(), 'yyyy-MM-dd');
    worksheet.getCell('A1').font = { bold: true };
    worksheet.getCell('B1').font = { bold: true };

    // Fila 2: encabezados
    worksheet.getCell('A2').value = 'cedula';
    worksheet.getCell('B2').value = 'monto';
    worksheet.getRow(2).font = { bold: true };

    // Filas de ejemplo
    worksheet.getCell('A3').value = 'V-12345678';
    worksheet.getCell('B3').value = 1500.5;
    worksheet.getCell('A4').value = 'V-87654321';
    worksheet.getCell('B4').value = 2500;

    return await workbook.xlsx.writeBuffer();
  }

  async bulkUpload(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    dto?: { paymentDate?: string },
  ) {
    return this.bulkPayment.execute(tenantId, userId, file, dto);
  }

  async findAll(tenantId: string, dto: FilterLoanPaidDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      bank = '',
      type = '',
      method = '',
    } = dto || {};

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const conditions: SQL<unknown>[] = [eq(loanPayments.tenantId, tenantId)];

    if (search) {
      conditions.push(ilike(loanPayments.customReference, `%${search}%`));
    }
    if (bank !== '') {
      conditions.push(eq(loanPayments.bankId, bank));
    }
    if (type !== '') {
      conditions.push(eq(loanPayments.paymentType, type as loanPaymetTypeEnum));
    }
    if (method) {
      conditions.push(
        eq(loanPayments.paymentMethod, method as paymentMethodEnum),
      );
    }

    const where = and(...conditions);

    const orderBy =
      sortOrder === 'asc'
        ? sql`${loanPayments[sortBy as keyof typeof loanPayments]} asc`
        : sql`${loanPayments[sortBy as keyof typeof loanPayments]} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loanPayments)
      .where(where);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limitNumber);

    const data = await this.db
      .select({
        id: loanPayments.id,
        loanId: loanPayments.loanId,
        customReference: loanPayments.customReference,
        paymentDate: loanPayments.paymentDate,
        paymentType: loanPayments.paymentType,
        paymentMethod: loanPayments.paymentMethod,
        bankId: loanPayments.bankId,
        bankAccountName: bankAccounts.accountName,
        bankAccountNumber: bankAccounts.accountNumber,
        transactionReference: loanPayments.transactionReference,
        amount: loanPayments.amount,
        balancePending: loanPayments.balancePending,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        paymentStatus: loanPayments.status,
        loanCustomReference: loans.customReference,
        comment: loanPayments.comment,
      })
      .from(loanPayments)
      .where(where)
      .leftJoin(bankAccounts, eq(bankAccounts.id, loanPayments.bankId))
      .leftJoin(
        loans,
        and(eq(loans.id, loanPayments.loanId), eq(loans.tenantId, tenantId)),
      )
      .leftJoin(associates, eq(associates.id, loans.associateId))
      .orderBy(orderBy)
      .limit(limitNumber)
      .offset(offset);

    const trnasformData = data.map((item) => ({
      ...item,
      amount: Number(item.amount).toFixed(2),
      balancePending: Number(item.balancePending).toFixed(2),
    }));

    const meta = {
      totalItems: totalCount,
      itemCount: data.length,
      itemsPerPage: limitNumber,
      totalPages,
      currentPage: pageNumber,
    };

    return { data: trnasformData, meta };
  }

  async findOneRequest(cedula: string, tenantId: string) {
    const associate = await this.db
      .select({
        id: associates.id,
        cedula: associates.cedula,
        fullname: associates.fullname,
        phone: associates.phone,
        email: associates.email,
        status: associates.status,
        accountNumber: associateAccounts.accountNumber,
        balance: associateAccounts.balance,
      })
      .from(associates)
      .leftJoin(
        associateAccounts,
        and(
          eq(associateAccounts.associateId, associates.id),
          eq(associateAccounts.status, 'ACTIVE'),
        ),
      )
      .where(
        and(eq(associates.cedula, cedula), eq(associates.tenantId, tenantId)),
      );

    if (!associate.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }
    if (associate[0].status === 'INACTIVE') {
      throw new NotFoundException(
        `Associate with cedula ${cedula} is inactive`,
      );
    }
    if (associate[0].status === 'RETIRED') {
      throw new NotFoundException(`Associate with cedula ${cedula} is retired`);
    }

    const result = await this.db
      .select({
        loanId: loans.id,
        loanType: loanTypes.name,
        loanTotalAmount: loans.totalPayable,
        loanModality: loans.loanModality,
        loanCustomReference: loans.customReference,
        loanRequestedAmount: loans.requestedAmount,
        status: loans.status,
      })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, associate[0].id),
          ne(loans.status, LoanStatusEnum.PAID),
          ne(loans.status, LoanStatusEnum.CANCELLED),
        ),
      )
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .leftJoin(
        loanAmortizationSchedule,
        eq(loans.id, loanAmortizationSchedule.loanId),
      );

    const loanAmortization = await this.db
      .select({
        id: loanAmortizationSchedule.id,
        quotaNumber: loanAmortizationSchedule.installmentNumber,
        quotaAmount: loanAmortizationSchedule.totalInstallmentAmount,
        quotaDate: loanAmortizationSchedule.dueDate,
        quotaStatus: loanAmortizationSchedule.paymentStatus,
        quotaPartial: loanAmortizationSchedule.paidAmount,
        principalBalancePending:
          loanAmortizationSchedule.principalBalancePending,
        paidAmount: loanAmortizationSchedule.paidAmount,
      })
      .from(loanAmortizationSchedule)
      .where(eq(loanAmortizationSchedule.loanId, result[0]?.loanId))
      .orderBy(sql<string>`
        CASE payment_status
          WHEN 'PARTIAL' THEN 1
          WHEN 'PENDING' THEN 2
          WHEN 'PAID' THEN 3
          ELSE 4
        END ASC,
        id ASC`);

    const pendingQuotas = loanAmortization.filter(
      (item) => item.quotaStatus === 'PENDING',
    );
    const partialQuotas = loanAmortization.filter(
      (item) => item.quotaStatus === 'PARTIAL',
    );

    const totalPending = pendingQuotas.reduce((acc, item) => {
      return acc + (Number(item.quotaAmount) || 0);
    }, 0);

    const totalPartial = partialQuotas.reduce((acc, item) => {
      const totalAmount = Number(item.quotaAmount) || 0;
      const paidAmount = Number(item.paidAmount) || 0;
      const remaining = totalAmount - paidAmount;
      return acc + (remaining > 0 ? remaining : 0);
    }, 0);

    const totalPendingAmount = totalPending + totalPartial;

    const transformLoandAdmortization = loanAmortization.map((item) => ({
      ...item,
      principalBalancePending: Number(item.principalBalancePending).toFixed(2),
      quotaAmount: Number(item.quotaAmount).toFixed(2),
      paidAmount: Number(item.paidAmount).toFixed(2),
    }));

    return {
      id: associate[0].id,
      cedula: associate[0].cedula,
      fullname: associate[0].fullname,
      phone: associate[0].phone,
      email: associate[0].email,
      accountNumber: associate[0].accountNumber || null,
      balance: associate[0].balance || null,
      loanId: result.length === 0 ? null : result[0]?.loanId,
      loanType: result.length === 0 ? null : result[0]?.loanType,
      loanTotalAmount: String(totalPendingAmount.toFixed(2)),
      loanModality: result.length === 0 ? null : result[0]?.loanModality,
      loanCustomReference:
        result.length === 0 ? null : result[0]?.loanCustomReference,
      loanRequestedAmount:
        result.length === 0 ? null : result[0]?.loanRequestedAmount,
      loanAmortization: transformLoandAdmortization || null,
      loanStatus: result.length === 0 ? null : result[0]?.status,
    };
  }

  async findOne(tenantId: string, paymentId: string) {
    const conditions: SQL<unknown>[] = [eq(loanPayments.id, paymentId)];
    if (tenantId) {
      conditions.push(eq(loanPayments.tenantId, tenantId));
    }

    const [payment] = await this.db
      .select({
        id: loanPayments.id,
        customReference: loanPayments.customReference,
        loanId: loanPayments.loanId,
        paymentDate: loanPayments.paymentDate,
        paymentType: loanPayments.paymentType,
        paymentMethod: loanPayments.paymentMethod,
        bankId: loanPayments.bankId,
        bankAccountName: bankAccounts.accountName,
        bankAccountNumber: bankAccounts.accountNumber,
        transactionReference: loanPayments.transactionReference,
        amount: loanPayments.amount,
        balancePending: loanPayments.balancePending,
        comment: loanPayments.comment,
        status: loanPayments.status,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        loanCustomReference: loans.customReference,
      })
      .from(loanPayments)
      .where(and(...conditions))
      .leftJoin(bankAccounts, eq(bankAccounts.id, loanPayments.bankId))
      .leftJoin(loans, eq(loans.id, loanPayments.loanId))
      .leftJoin(associates, eq(associates.id, loans.associateId));

    if (!payment) {
      throw new NotFoundException(
        `Loan payment with id ${paymentId} not found`,
      );
    }

    const details = await this.db
      .select({
        id: loanPaymentsDetails.id,
        amount: loanPaymentsDetails.amount,
        installmentNumber: loanAmortizationSchedule.installmentNumber,
        dueDate: loanAmortizationSchedule.dueDate,
        totalInstallmentAmount: loanAmortizationSchedule.totalInstallmentAmount,
        principalAmount: loanAmortizationSchedule.principalAmount,
        interestAmount: loanAmortizationSchedule.interestAmount,
      })
      .from(loanPaymentsDetails)
      .leftJoin(
        loanAmortizationSchedule,
        eq(loanAmortizationSchedule.id, loanPaymentsDetails.installmentId),
      )
      .where(eq(loanPaymentsDetails.loanPaymentId, paymentId));

    return {
      ...payment,
      amount: Number(payment.amount).toFixed(2),
      balancePending: Number(payment.balancePending).toFixed(2),
      details: details.map((d) => ({
        ...d,
        amount: Number(d.amount).toFixed(2),
      })),
    };
  }

  async remove(paymentId: string, tenantId: string, userId: string) {
    return this.cancelPayment.execute(paymentId, tenantId, userId);
  }

  async getReportsPdf(tenantId: string, dto?: FilterLoanPaidDto) {
    let rawData: any[];

    if (dto) {
      const payload = await this.findAll(tenantId, {
        ...dto,
        limit: dto.search ? 99999 : (dto.limit ?? 99999),
      });
      rawData = payload.data;
    } else {
      rawData = await this.db
        .select({
          id: loanPayments.id,
          loanId: loanPayments.loanId,
          customReference: loanPayments.customReference,
          paymentDate: loanPayments.paymentDate,
          paymentType: loanPayments.paymentType,
          paymentMethod: loanPayments.paymentMethod,
          bankName: bankAccounts.accountName,
          transactionReference: loanPayments.transactionReference,
          amount: loanPayments.amount,
          balancePending: loanPayments.balancePending,
          associateCedula: associates.cedula,
          associateFullname: associates.fullname,
          paymentStatus: loanPayments.status,
        })
        .from(loanPayments)
        .leftJoin(bankAccounts, eq(bankAccounts.id, loanPayments.bankId))
        .leftJoin(
          loans,
          and(eq(loans.id, loanPayments.loanId), eq(loans.tenantId, tenantId)),
        )
        .leftJoin(associates, eq(associates.id, loans.associateId))
        .where(eq(loanPayments.tenantId, tenantId))
        .orderBy(sql`${loanPayments.id} desc`)
        .limit(1000);
    }

    const paymentTypeMapper: Record<string, string> = {
      PAYING: 'Pago Cuota',
      CANCELLATION: 'Cancelación Pago',
    };

    const paymentStatusMapper: Record<string, string> = {
      DONE: 'Pagado',
      CANCELED: 'Anulado',
    };

    const tableBody = [
      ['Referencia', 'Fecha', 'Cédula', 'Asociado', 'Monto', 'Tipo', 'Estado'],
      ...rawData.map((item) => [
        item.customReference ?? 'N/A',
        item.paymentDate
          ? format(new Date(item.paymentDate), 'dd/MM/yyyy')
          : 'N/A',
        item.associateCedula ?? 'N/A',
        item.associateFullname ?? 'N/A',
        item.amount
          ? `${Number(item.amount).toLocaleString('es-VE', {
              minimumFractionDigits: 2,
            })}`
          : '0,00',
        item.paymentType
          ? paymentTypeMapper[item.paymentType] || item.paymentType
          : 'N/A',
        item.paymentStatus
          ? paymentStatusMapper[item.paymentStatus] || item.paymentStatus
          : 'N/A',
      ]),
    ];

    const content = {
      table: {
        headerRows: 1,
        widths: [80, 60, 60, '*', 70, 70, 60],
        body: tableBody,
      },
      layout: 'lightHorizontalLines',
    };

    return this.pdfService.generateReport(
      'LISTADO DE PAGOS DE PRÉSTAMOS',
      content,
      { orientation: 'landscape', pageSize: 'LETTER' },
    );
  }

  async applyPaymentFromBankReconciliation(
    paymentId: string,
    tx: NodePgDatabase<typeof schema>,
  ) {
    await this.processor.applyPaymentFromBankReconciliation(paymentId, tx);
  }
}
