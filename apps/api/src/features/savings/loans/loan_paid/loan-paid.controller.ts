import { Permissions } from '@/common/decorators/permissions.decorator';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { LoanPaidService } from './loan-paid.service';
import {
  CreateLoanPaidSchema,
  FilterLoanPaidSchema,
  CreateBulkLoanPaidSchema,
  CreateLoanPaidDto,
  FilterLoanPaidDto,
  CreateBulkLoanPaidDto,
} from './dto/loan-paid.schema';

@Controller('loan-paid')
export class LoanPaidController {
  constructor(
    private readonly loanPaidService: LoanPaidService,
    private readonly tenantContextService: TenantContextService,
  ) { }

  @Post()
  @Permissions('portfolio:payments-loans:read')
  @UsePipes(new ZodValidatorPipe(CreateLoanPaidSchema))
  create(@Req() req: Request, @Body() dto: CreateLoanPaidDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.loanPaidService.create(targetTenantId, userId, dto);
  }

  @Get('download-template')
  @Permissions('portfolio:payments-loans:read')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.loanPaidService.downloadTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="plantilla-pagos-prestamos.xlsx"',
    });
    res.send(buffer);
  }

  @Post('bulk')
  @Permissions('portfolio:payments-loans:read')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ZodValidatorPipe(CreateBulkLoanPaidSchema))
  bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Body() dto: CreateBulkLoanPaidDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.loanPaidService.bulkUpload(targetTenantId, userId, file, dto);
  }

  @Get()
  @Permissions('portfolio:payments-loans:read')
  @ApiOperation({ summary: 'Get all Loan paid or filter by Loan paid ' })
  @ApiResponse({ status: 200, description: 'Return all Loan paid.' })
  findAll(@Req() req: Request, @Query() dto: FilterLoanPaidDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanPaidService.findAll(targetTenantId, dto);
  }

  @Get('report/pdf')
  @Permissions('portfolio:payments-loans:read')
  @ApiOperation({ summary: 'Generate and download PDF report of loan payments' })
  async downloadReportPdf(
    @Req() req: Request,
    @Query() filterDto: FilterLoanPaidDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const pdfDoc = await this.loanPaidService.getReportsPdf(targetTenantId, filterDto);
    const filename = `reporte_pagos_prestamos_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('request/:cedula')
  @Permissions('portfolio:payments-loans:read')
  @ApiOperation({ summary: 'Get one Loan associate' })
  @ApiResponse({ status: 200, description: 'Return on Loan associate.' })
  @ApiResponse({ status: 404, description: 'Loan Associate  not found.' })
  findOneRequest(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanPaidService.findOneRequest(cedula, targetTenantId);
  }

  @Get(':id')
  @Permissions('portfolio:payments-loans:read')
  @ApiOperation({ summary: 'Get one Loan payment detail' })
  @ApiResponse({ status: 200, description: 'Return one Loan payment.' })
  @ApiResponse({ status: 404, description: 'Loan payment not found.' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanPaidService.findOne(targetTenantId, id);
  }

  @Delete(':id')
  @Permissions('portfolio:payments-loans:read')
  @ApiOperation({ summary: 'Cancel a Loan Payment' })
  @ApiResponse({
    status: 200,
    description: 'Loan payment canceled successfully.',
  })
  @ApiResponse({ status: 404, description: 'Loan payment not found.' })
  remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.loanPaidService.remove(id, targetTenantId, userId);
  }
}
