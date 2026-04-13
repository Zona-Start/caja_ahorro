import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateBulkLoanPaidDto } from './dto/bulk-loan-paid.dto';
import { CreateLoanPaidDto } from './dto/create-loan.dto';
import { FilterLoanPaidDto } from './dto/filter-loan-paid.dto';
import { LoanPaidService } from './loan-paid.service';

@Controller('loan-paid')
export class LoanPaidController {
  constructor(private readonly loanPaidService: LoanPaidService) {}

  @Post()
  @RequirePermissions('read:loan-paid')
  create(@Body() createLoanPaidDto: CreateLoanPaidDto, @Req() req: any) {
    const userId = req.user.id;
    return this.loanPaidService.create(createLoanPaidDto, userId);
  }

  @Get('download-template')
  @RequirePermissions('read:loan-management')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.loanPaidService.downloadTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-pagos-prestamos.xlsx"',
    });
    res.send(buffer);
  }

  @Post('bulk')
  @RequirePermissions('update:loan-management')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.loanPaidService.bulkUpload(file, userId);
  }

  @Get()
  @RequirePermissions('read:loan-paid')
  @ApiOperation({ summary: 'Get all Loan paid or filter by Loan paid ' })
  @ApiResponse({ status: 200, description: 'Return all Loan paid.' })
  findAll(@Query() paginationDto: FilterLoanPaidDto) {
    return this.loanPaidService.findAll(paginationDto);
  }

  @Get('report/pdf')
  @RequirePermissions('read:loan-paid')
  @ApiOperation({ summary: 'Generate and download PDF report of loan payments' })
  async downloadReportPdf(
    @Query() filterDto: FilterLoanPaidDto,
    @Res() res: Response,
  ) {
    const pdfDoc = await this.loanPaidService.getReportsPdf(filterDto);

    const filename = `reporte_pagos_prestamos_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  // @Get('count')
  // @RequirePermissions('read:loan-management-count')
  // @ApiOperation({ summary: 'Get all Loan count' })
  // @ApiResponse({ status: 200, description: 'Return all Loan count.' })
  // findCountAllLoans() {
  //   return this.loanManagementService.findCountAllLoans();
  // }

  @Get('request/:cedula')
  @RequirePermissions('read:loan-paid-requests')
  @ApiOperation({ summary: 'Get one Loan associate' })
  @ApiResponse({ status: 200, description: 'Return on Loan associate.' })
  @ApiResponse({ status: 404, description: 'Loan Associate  not found.' })
  findOneRequest(@Param('cedula') cedula: string) {
    return this.loanPaidService.findOneRequest(cedula);
  }

  // @Get('request/byEdit/:id')
  // @RequirePermissions('read:loan-management-edit')
  // @ApiOperation({ summary: 'Get one Loan by edit' })
  // @ApiResponse({ status: 200, description: 'Return on Loan edit.' })
  // @ApiResponse({ status: 404, description: 'Loan edit  not found.' })
  // findOneEdit(@Param('id') id: string) {
  //   return this.loanManagementService.findRequestByEdit(+id);
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.loanManagementService.findOne(+id);
  // }

  // @Patch(':id')
  // @RequirePermissions('update:loan-management')
  // @ApiOperation({ summary: 'Update an Loan ' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Loan  updated successfully.',
  // })
  // @ApiResponse({ status: 404, description: 'Loan  not found.' })
  // update(
  //   @Req() req: Request,
  //   @Param('id') id: string,
  //   @Body() updateLoanDto: UpdateLoanDto,
  // ) {
  //   const userdId = req['user'].id;
  //   return this.loanManagementService.update(+id, updateLoanDto, userdId);
  // }

  // @Delete(':id')
  // @Roles('admin')
  // @RequirePermissions('delete:loan-management')
  // @ApiOperation({ summary: 'Delete an Loan ' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Loan  deleted successfully.',
  // })
  // @ApiResponse({ status: 404, description: 'Loan  not found.' })
  // remove(@Param('id') id: string) {
  //   return this.loanManagementService.remove(+id);
  // }

  @Delete(':id')
  @RequirePermissions('delete:loan-paid')
  @ApiOperation({ summary: 'Cancel a Loan Payment' })
  @ApiResponse({ status: 200, description: 'Loan payment canceled successfully.' })
  @ApiResponse({ status: 404, description: 'Loan payment not found.' })
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.loanPaidService.remove(+id, userId);
  }
}
