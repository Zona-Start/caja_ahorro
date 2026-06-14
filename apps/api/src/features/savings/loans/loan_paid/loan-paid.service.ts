import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associates,
  bankDirectory,
  loanAmortizationSchedule,
  loanPayments,
  loans,
  loanTypes,
} from '@/database/schema';
import {
  LoanStatusEnum,
  loanPaymetTypeEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { and, eq, ilike, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { CreateLoanPaidDto, FilterLoanPaidDto } from './dto/loan-paid.schema';
import { LoanPaymentValidator } from './domain/loan-payment.validator';
import { LoanPaymentProcessor } from './domain/loan-payment.processor';
import { CreatePaymentUseCase } from './use-cases/create-payment.usecase';
import { BulkPaymentUseCase } from './use-cases/bulk-payment.usecase';
import { CancelPaymentUseCase } from './use-cases/cancel-payment.usecase';

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
    return this.createPayment.execute(tenantId, userId, dto, tx, liquidationActive);
  }

  async downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla de Pagos');

    worksheet.columns = [
      { header: 'cedula', key: 'cedula', width: 20 },
      { header: 'monto', key: 'monto', width: 15 },
      { header: 'fecha', key: 'fecha', width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true };

    worksheet.addRow({
      cedula: 'V-12345678',
      monto: 1500.5,
      fecha: format(new Date(), 'yyyy-MM-dd'),
    });

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

    const offset = (page - 1) * limit;

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
      conditions.push(eq(loanPayments.paymentMethod, method as paymentMethodEnum));
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
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: loanPayments.id,
        customReference: loanPayments.customReference,
        paymentDate: loanPayments.paymentDate,
        paymentType: loanPayments.paymentType,
        paymentMethod: loanPayments.paymentMethod,
        bankName: bankDirectory.name,
        transactionReference: loanPayments.transactionReference,
        amount: loanPayments.amount,
        balancePending: loanPayments.balancePending,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        paymentStatus: loanPayments.status,
      })
      .from(loanPayments)
      .where(where)
      .leftJoin(bankDirectory, eq(bankDirectory.id, loanPayments.bankId))
      .leftJoin(
        loans,
        and(eq(loans.id, loanPayments.loanId), eq(loans.tenantId, tenantId)),
      )
      .leftJoin(associates, eq(associates.id, loans.associateId))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const trnasformData = data.map((item) => ({
      ...item,
      amount: Number(item.amount).toFixed(2),
      balancePending: Number(item.balancePending).toFixed(2),
    }));

    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data: trnasformData, meta };
  }

  async findOneRequest(cedula: string, tenantId: string) {
    const associate = await this.validator.findAssociateByCedula(cedula, tenantId);

    if (associate.status === 'INACTIVE') {
      throw new NotFoundException(`Associate with cedula ${cedula} is inactive`);
    }
    if (associate.status === 'RETIRED') {
      throw new NotFoundException(`Associate with cedula ${cedula} is retired`);
    }

    const result = await this.db
      .select({
        loanId: loans.id,
        loanType: loanTypes.name,
        loanTotalAmount: loans.totalPayable,
        loanModality: loans.loanModality,
        status: loans.status,
      })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, associate.id),
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
        principalBalancePending: loanAmortizationSchedule.principalBalancePending,
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
    }));

    return {
      id: associate.id,
      cedula: associate.cedula,
      fullname: associate.fullname,
      phone: associate.phone,
      email: associate.email,
      loanId: result.length === 0 ? null : result[0]?.loanId,
      loanType: result.length === 0 ? null : result[0]?.loanType,
      loanTotalAmount: String(totalPendingAmount.toFixed(2)),
      loanModality: result.length === 0 ? null : result[0]?.loanModality,
      loanAmortization: transformLoandAdmortization || null,
      loanStatus: result.length === 0 ? null : result[0]?.status,
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
          customReference: loanPayments.customReference,
          paymentDate: loanPayments.paymentDate,
          paymentType: loanPayments.paymentType,
          paymentMethod: loanPayments.paymentMethod,
          bankName: bankDirectory.name,
          transactionReference: loanPayments.transactionReference,
          amount: loanPayments.amount,
          balancePending: loanPayments.balancePending,
          associateCedula: associates.cedula,
          associateFullname: associates.fullname,
          paymentStatus: loanPayments.status,
        })
        .from(loanPayments)
        .leftJoin(bankDirectory, eq(bankDirectory.id, loanPayments.bankId))
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
