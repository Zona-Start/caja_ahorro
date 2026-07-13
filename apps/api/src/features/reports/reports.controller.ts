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
import { AssociatesReportService } from './services/associates-report.service';
import { HaberesReportService } from './services/haberes-report.service';
import { WithdrawalsReportService } from './services/withdrawals-report.service';
import { VariationsReportService } from './services/variations-report.service';
import { LoansReportService } from './services/loans-report.service';
import { QuotasReportService } from './services/quotas-report.service';
import { CreditsReportService } from './services/credits-report.service';
import { CreditQuotasReportService } from './services/credit-quotas-report.service';
import {
  AssociatesReportDto,
  AssociatesReportSchema,
} from './dto/associates-report.dto';
import {
  HaberesReportDto,
  HaberesReportSchema,
} from './dto/haberes-report.dto';
import {
  WithdrawalsReportDto,
  WithdrawalsReportSchema,
} from './dto/withdrawals-report.dto';
import {
  VariationsReportDto,
  VariationsReportSchema,
} from './dto/variations-report.dto';
import {
  LoansReportDto,
  LoansReportSchema,
} from './dto/loans-report.dto';
import {
  QuotasReportDto,
  QuotasReportSchema,
} from './dto/quotas-report.dto';
import {
  CreditsReportDto,
  CreditsReportSchema,
} from './dto/credits-report.dto';
import {
  CreditQuotasReportDto,
  CreditQuotasReportSchema,
} from './dto/credit-quotas-report.dto';

@ApiTags('reports')
@UseInterceptors(ReqLogInterceptor)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly associatesReportService: AssociatesReportService,
    private readonly haberesReportService: HaberesReportService,
    private readonly withdrawalsReportService: WithdrawalsReportService,
    private readonly variationsReportService: VariationsReportService,
    private readonly loansReportService: LoansReportService,
    private readonly quotasReportService: QuotasReportService,
    private readonly creditsReportService: CreditsReportService,
    private readonly creditQuotasReportService: CreditQuotasReportService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('associates/pdf')
  @ApiOperation({ summary: 'Download associates PDF report with filters' })
  async downloadAssociatesPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(AssociatesReportSchema))
    filters: AssociatesReportDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.associatesReportService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    const filename = `reporte_asociados_${today}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('haberes/pdf')
  @ApiOperation({ summary: 'Download haberes PDF report with filters' })
  async downloadHaberesPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(HaberesReportSchema))
    filters: HaberesReportDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.haberesReportService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    const filename = `reporte_haberes_${today}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('withdrawals/pdf')
  @ApiOperation({ summary: 'Download withdrawals PDF report with filters' })
  async downloadWithdrawalsPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(WithdrawalsReportSchema))
    filters: WithdrawalsReportDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.withdrawalsReportService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    const filename = `reporte_retiros_haberes_${today}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('variations/pdf')
  @ApiOperation({ summary: 'Download variations PDF report with filters' })
  async downloadVariationsPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(VariationsReportSchema))
    filters: VariationsReportDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.variationsReportService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    const filename = `reporte_variaciones_${today}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('loans/pdf')
  @ApiOperation({ summary: 'Download loans PDF report with filters' })
  async downloadLoansPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(LoansReportSchema))
    filters: LoansReportDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.loansReportService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    const filename = `reporte_prestamos_${today}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('quotas/pdf')
  @ApiOperation({ summary: 'Download quotas PDF report with filters' })
  async downloadQuotasPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(QuotasReportSchema))
    filters: QuotasReportDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.quotasReportService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    const filename = `reporte_cuotas_${today}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('credits/pdf')
  @ApiOperation({ summary: 'Download credits PDF report with filters' })
  async downloadCreditsPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(CreditsReportSchema))
    filters: CreditsReportDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.creditsReportService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    const filename = `reporte_creditos_${today}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('credit-quotas/pdf')
  @ApiOperation({ summary: 'Download credit quotas PDF report with filters' })
  async downloadCreditQuotasPdf(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(CreditQuotasReportSchema))
    filters: CreditQuotasReportDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.creditQuotasReportService.generatePdf(
      targetTenantId,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];
    const filename = `reporte_cuotas_creditos_${today}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }
}
