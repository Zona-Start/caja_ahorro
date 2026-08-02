import { TenantContextService } from '@/common/services/tenant-context.service';
import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BankingReportsService } from './banking-reports.service';

@ApiTags('bankings/reports')
@Controller('bankings/reports')
export class BankingReportsController {
  constructor(
    private readonly service: BankingReportsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  // ── 1. Acta de Conciliación ──
  @Get('reconciliation-act/:id/download-excel')
  async downloadReconciliationActExcel(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const wb = await this.service.reconciliationActExcel(id, targetTenantId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=acta_${id.slice(0, 8)}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  }

  @Get('reconciliation-act/:id/download-pdf')
  async downloadReconciliationActPdf(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const pdf = await this.service.reconciliationActPdf(id, targetTenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=acta_${id.slice(0, 8)}.pdf`);
    pdf.pipe(res);
    pdf.end();
  }

  @Get('reconciliation-act/:id')
  @ApiOperation({ summary: 'Get reconciliation act data' })
  async reconciliationAct(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const data = await this.service.reconciliationAct(id, targetTenantId);
    return { message: 'Acta de conciliación', data };
  }

  // ── 2. Partidas Pendientes ──
  @Get('pending-items/download-excel')
  async downloadPendingItemsExcel(
    @Req() req: any, @Res() res: Response,
    @Query('bankAccountId') bankAccountId: string = '',
    @Query('daysOld') daysOld: string = '',
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const wb = await this.service.pendingItemsExcel(targetTenantId, bankAccountId || undefined, parseInt(daysOld) || 30);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=partidas_pendientes.xlsx');
    await wb.xlsx.write(res);
    res.end();
  }

  @Get('pending-items/download-pdf')
  async downloadPendingItemsPdf(
    @Req() req: any, @Res() res: Response,
    @Query('bankAccountId') bankAccountId: string = '',
    @Query('daysOld') daysOld: string = '',
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const pdf = await this.service.pendingItemsPdf(targetTenantId, bankAccountId || undefined, parseInt(daysOld) || 30);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=partidas_pendientes.pdf');
    pdf.pipe(res);
    pdf.end();
  }

  @Get('pending-items')
  @ApiOperation({ summary: 'Get pending reconciliation items' })
  async pendingItems(
    @Req() req: any,
    @Query('bankAccountId') bankAccountId?: string,
    @Query('daysOld') daysOld?: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const days = daysOld ? parseInt(daysOld) : 30;
    const data = await this.service.pendingItems(targetTenantId, bankAccountId, days);
    return { message: 'Partidas pendientes', data };
  }

  // ── 3. Posición Consolidada ──
  @Get('consolidated-position/download-excel')
  async downloadConsolidatedPositionExcel(@Req() req: any, @Res() res: Response) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const wb = await this.service.consolidatedPositionExcel(targetTenantId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=posicion_consolidada.xlsx');
    await wb.xlsx.write(res);
    res.end();
  }

  @Get('consolidated-position/download-pdf')
  async downloadConsolidatedPositionPdf(@Req() req: any, @Res() res: Response) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const pdf = await this.service.consolidatedPositionPdf(targetTenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=posicion_consolidada.pdf');
    pdf.pipe(res);
    pdf.end();
  }

  @Get('consolidated-position')
  @ApiOperation({ summary: 'Get consolidated bank position' })
  async consolidatedPosition(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const data = await this.service.consolidatedPosition(targetTenantId);
    return { message: 'Posición consolidada', data };
  }

  // ── 4. Auxiliar de Bancos ──
  @Get('auxiliary-book/download-excel')
  async downloadAuxiliaryBookExcel(
    @Req() req: any, @Res() res: Response,
    @Query('bankAccountId') bankAccountId: string = '',
    @Query('dateFrom') dateFrom: string = '',
    @Query('dateTo') dateTo: string = '',
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const wb = await this.service.auxiliaryBookExcel(targetTenantId, bankAccountId, dateFrom || undefined, dateTo || undefined);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=auxiliar_bancos.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  }

  @Get('auxiliary-book/download-pdf')
  async downloadAuxiliaryBookPdf(
    @Req() req: any, @Res() res: Response,
    @Query('bankAccountId') bankAccountId: string = '',
    @Query('dateFrom') dateFrom: string = '',
    @Query('dateTo') dateTo: string = '',
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const pdf = await this.service.auxiliaryBookPdf(targetTenantId, bankAccountId, dateFrom || undefined, dateTo || undefined);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=auxiliar_bancos.pdf`);
    pdf.pipe(res);
    pdf.end();
  }

  @Get('auxiliary-book')
  @ApiOperation({ summary: 'Get bank auxiliary book' })
  async auxiliaryBook(
    @Req() req: any,
    @Query('bankAccountId') bankAccountId: string = '',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req, {});
    const data = await this.service.auxiliaryBook(targetTenantId, bankAccountId, dateFrom, dateTo);
    return { message: 'Auxiliar de bancos', data };
  }
}
