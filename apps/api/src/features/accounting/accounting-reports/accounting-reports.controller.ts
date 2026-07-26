import { ReqLogInterceptor } from '@/common/interceptors/req-log.interceptor';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  JournalBookDto,
  JournalBookSchema,
} from './dto/journal-book.dto';
import {
  GeneralLedgerDto,
  GeneralLedgerSchema,
} from './dto/general-ledger.dto';
import {
  TrialBalanceDto,
  TrialBalanceSchema,
} from './dto/trial-balance.dto';
import {
  BalanceSheetDto,
  BalanceSheetSchema,
} from './dto/balance-sheet.dto';
import {
  IncomeStatementDto,
  IncomeStatementSchema,
} from './dto/income-statement.dto';
import {
  AssociatesBalanceDto,
  AssociatesBalanceSchema,
} from './dto/associates-balance.dto';
import { JournalBookService } from './services/journal-book.service';
import { GeneralLedgerService } from './services/general-ledger.service';
import { TrialBalanceService } from './services/trial-balance.service';
import { BalanceSheetService } from './services/balance-sheet.service';
import { IncomeStatementService } from './services/income-statement.service';
import { AssociatesBalanceService } from './services/associates-balance.service';

@ApiTags('accounting-reports')
@UseInterceptors(ReqLogInterceptor)
@Controller('accounting-reports')
export class AccountingReportsController {
  constructor(
    private readonly journalBookService: JournalBookService,
    private readonly generalLedgerService: GeneralLedgerService,
    private readonly trialBalanceService: TrialBalanceService,
    private readonly balanceSheetService: BalanceSheetService,
    private readonly incomeStatementService: IncomeStatementService,
    private readonly associatesBalanceService: AssociatesBalanceService,
    private readonly tenantContext: TenantContextService,
  ) {}

  // ---------- Libro Diario ----------
  @Get('journal-book')
  @ApiOperation({ summary: 'Get Journal Book data' })
  async getJournalBook(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(JournalBookSchema))
    filters: JournalBookDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    return this.journalBookService.getData(targetTenantId, filters);
  }

  @Get('journal-book/pdf')
  @ApiOperation({ summary: 'Download Journal Book PDF' })
  async downloadJournalBookPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(JournalBookSchema))
    filters: JournalBookDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.journalBookService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=libro_diario_${today}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  // ---------- Libro Mayor ----------
  @Get('general-ledger')
  @ApiOperation({ summary: 'Get General Ledger data' })
  async getGeneralLedger(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(GeneralLedgerSchema))
    filters: GeneralLedgerDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    return this.generalLedgerService.getData(targetTenantId, filters);
  }

  @Get('general-ledger/pdf')
  @ApiOperation({ summary: 'Download General Ledger PDF' })
  async downloadGeneralLedgerPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(GeneralLedgerSchema))
    filters: GeneralLedgerDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.generalLedgerService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=libro_mayor_${today}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  // ---------- Balance de Comprobación ----------
  @Get('trial-balance')
  @ApiOperation({ summary: 'Get Trial Balance data' })
  async getTrialBalance(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(TrialBalanceSchema))
    filters: TrialBalanceDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    return this.trialBalanceService.getData(targetTenantId, filters);
  }

  @Get('trial-balance/pdf')
  @ApiOperation({ summary: 'Download Trial Balance PDF' })
  async downloadTrialBalancePdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(TrialBalanceSchema))
    filters: TrialBalanceDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.trialBalanceService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=balance_comprobacion_${today}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  // ---------- Balance General ----------
  @Get('balance-sheet')
  @ApiOperation({ summary: 'Get Balance Sheet data' })
  async getBalanceSheet(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(BalanceSheetSchema))
    filters: BalanceSheetDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    return this.balanceSheetService.getData(targetTenantId, filters);
  }

  @Get('balance-sheet/pdf')
  @ApiOperation({ summary: 'Download Balance Sheet PDF' })
  async downloadBalanceSheetPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(BalanceSheetSchema))
    filters: BalanceSheetDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.balanceSheetService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=balance_general_${today}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  // ---------- Estado de Resultados ----------
  @Get('income-statement')
  @ApiOperation({ summary: 'Get Income Statement data' })
  async getIncomeStatement(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(IncomeStatementSchema))
    filters: IncomeStatementDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    return this.incomeStatementService.getData(targetTenantId, filters);
  }

  @Get('income-statement/pdf')
  @ApiOperation({ summary: 'Download Income Statement PDF' })
  async downloadIncomeStatementPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(IncomeStatementSchema))
    filters: IncomeStatementDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.incomeStatementService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=estado_resultados_${today}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  // ---------- Balance de Asociados ----------
  @Get('associates-balance')
  @ApiOperation({ summary: 'Get Associates Balance data' })
  async getAssociatesBalance(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(AssociatesBalanceSchema))
    filters: AssociatesBalanceDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    return this.associatesBalanceService.getData(targetTenantId, filters);
  }

  @Get('associates-balance/pdf')
  @ApiOperation({ summary: 'Download Associates Balance PDF' })
  async downloadAssociatesBalancePdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(AssociatesBalanceSchema))
    filters: AssociatesBalanceDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.associatesBalanceService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=balance_asociados_${today}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }
}
