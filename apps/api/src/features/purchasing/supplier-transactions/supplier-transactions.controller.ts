import { TenantContextService } from '@/common/services/tenant-context.service';
import { Controller, Get, Param, Patch, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SupplierTransactionsService } from './supplier-transactions.service';
import { PurchasingXlsxService } from '@/features/purchasing/xlsx/purchasing-xlsx.service';
import { format } from 'date-fns';

@ApiTags('administration/supplier-transactions')
@Controller('administration/supplier-transactions')
export class SupplierTransactionsController {
  constructor(
    private readonly services: SupplierTransactionsService,
    private readonly tenantContextService: TenantContextService,
    private readonly xlsxService: PurchasingXlsxService,
  ) {}

  @Get('/account-statement')
  @ApiOperation({ summary: 'Get consolidated supplier account statement' })
  async getAccountStatement(@Req() req: Request, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.services.getAccountStatement(dto, targetTenantId);
    return { message: 'Statement fetched successfully', data };
  }

  @Get('/reports/aging')
  @ApiOperation({ summary: 'Get accounts payable aging report' })
  async getAgingReport(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.services.getAgingReport(targetTenantId);
    return { message: 'Aging report fetched', data };
  }

  @Get('/reports/tax-book')
  @ApiOperation({ summary: 'Get tax book report' })
  async getTaxBookReport(@Req() req: Request, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.services.getTaxBookReport(dto, targetTenantId);
    return { message: 'Tax book fetched', data };
  }

  @Get('/reports/cash-flow')
  @ApiOperation({ summary: 'Get cash flow projection' })
  async getCashFlowReport(@Req() req: Request, @Query() dto: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.services.getCashFlowReport(dto, targetTenantId);
    return { message: 'Cash flow fetched', data };
  }

  @Get('/reports/download/xlsx')
  async downloadXlsx(@Req() req: Request, @Query() dto: any, @Res() res: Response) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const { type, startDate, endDate, groupBy } = dto;

    let columns: string[];
    let rows: any[][];
    let filename: string;

    if (type === 'aging') {
      columns = ['Proveedor', 'Total Deuda', 'Por Vencer', '1-30 Días', '31-60 Días', '61-90 Días', '+90 Días'];
      const data = await this.services.getAgingReport(targetTenantId);
      rows = data.map((r: any) => [r.supplierName, r.totalDue, r.bucket0, r.bucket1to30, r.bucket31to60, r.bucket61to90, r.bucket90plus]);
      filename = 'antiguedad-deuda.xlsx';
    } else if (type === 'tax-book') {
      columns = ['Fecha', 'RIF', 'Proveedor', 'N° Factura', 'N° Control', 'Base Imponible', 'IVA', 'Total'];
      const data = await this.services.getTaxBookReport({ startDate, endDate }, targetTenantId);
      rows = data.map((r: any) => [r.date, r.supplierTaxId, r.supplierName, r.invoiceNumber, r.controlNumber, Number(r.subtotal), Number(r.taxAmount), Number(r.totalAmount)]);
      filename = 'libro-compras.xlsx';
    } else {
      columns = ['Período', 'Cantidad CxP', 'Total a Pagar'];
      const data = await this.services.getCashFlowReport({ groupBy: groupBy || 'month' }, targetTenantId);
      rows = data.map((r: any) => [r.period, r.count, Number(r.totalAmount)]);
      filename = 'flujo-caja.xlsx';
    }

    const buffer = await this.xlsxService.generateReport(columns, rows, 'Reporte');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('/advance')
  @ApiOperation({ summary: 'Get all supplier transactions advance' })
  async getSupplierTransactionAdvance(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result =
      await this.services.getSupplierTransactionAdvance(targetTenantId);
    return {
      message: 'Supplier transactions Advance fetched successfully',
      data: result,
    };
  }

  @Get('/note-credit')
  @ApiOperation({ summary: 'Get all supplier transactions note credit' })
  async getSupplierTransactionNoteCredit(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result =
      await this.services.getSupplierTransactionNoteCredit(targetTenantId);
    return {
      message: 'Supplier transactions note credit fetched successfully',
      data: result,
    };
  }

  @Get('/note-debit')
  @ApiOperation({ summary: 'Get all supplier transactions note debit' })
  async getSupplierTransactionNoteDebit(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result =
      await this.services.getSupplierTransactionNoteDebit(targetTenantId);
    return {
      message: 'Supplier transactions note debit fetched successfully',
      data: result,
    };
  }

  @Patch('/authorize-advance/:id')
  @ApiOperation({ summary: 'Authorize an supplier transactions advance' })
  @ApiResponse({
    status: 200,
    description: 'Supplier transactions Advance authorized successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier transactions Advance not found.',
  })
  async autorizeAdvancePayment(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    const data = await this.services.autorizeAdvancePayment(
      targetTenantId,
      userId,
      id,
    );
    return {
      message: 'Supplier transactions Advance authorized successfully',
      data,
    };
  }
}
