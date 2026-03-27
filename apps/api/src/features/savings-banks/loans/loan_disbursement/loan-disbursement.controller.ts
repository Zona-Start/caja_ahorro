import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { ConfirmLoanDisbursementBatchDto } from './dto/confirm-loan-disbursement-batch.dto';
import { DisburseBatchLoansDto } from './dto/disburse-batch-loans.dto';
import { DisburseIndividualLoanDto } from './dto/disburse-loan.dto';
import { LoanDisbursementService } from './loan-disbursement.service';

@Controller('loan-disbursement')
export class LoanDisbursementController {
  constructor(
    private readonly loanDisbursementService: LoanDisbursementService,
  ) {}

  // ── Desembolso individual ─────────────────────────────────────

  @Post('individual')
  @RequirePermissions('create:loan-disbursement')
  @ApiOperation({ summary: 'Desembolsar un préstamo de forma individual' })
  @ApiResponse({ status: 201, description: 'Préstamo desembolsado exitosamente' })
  disburseIndividual(
    @Req() req: Request,
    @Body() dto: DisburseIndividualLoanDto,
  ) {
    const userId = req['user'].id;
    return this.loanDisbursementService.disburseIndividual(dto, userId);
  }

  // ── Desembolso en lote ────────────────────────────────────────

  @Post('batch')
  @RequirePermissions('create:loan-disbursement-batch')
  @ApiOperation({ summary: 'Crear un lote de desembolso de préstamos (DRAFT)' })
  @ApiResponse({ status: 201, description: 'Lote creado exitosamente' })
  createBatch(@Req() req: Request, @Body() dto: DisburseBatchLoansDto) {
    const userId = req['user'].id;
    return this.loanDisbursementService.createDisbursementBatch(dto, userId);
  }

  @Patch('batch/:id/upload')
  @RequirePermissions('update:loan-disbursement-batch')
  @ApiOperation({ summary: 'Marcar el lote como UPLOADED (listo para confirmar)' })
  markAsUploaded(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    return this.loanDisbursementService.markAsUploaded(id, userId);
  }

  @Post('batch/:id/confirm')
  @RequirePermissions('update:loan-disbursement-batch')
  @ApiOperation({ summary: 'Confirmar el procesamiento del lote de desembolso' })
  @ApiResponse({ status: 200, description: 'Lote procesado exitosamente' })
  confirmBatch(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Body() dto: ConfirmLoanDisbursementBatchDto,
  ) {
    const userId = req['user'].id;
    return this.loanDisbursementService.confirmDisbursementBatch(id, dto, userId);
  }

  @Patch('batch/:id/cancel')
  @RequirePermissions('update:loan-disbursement-batch')
  @ApiOperation({ summary: 'Cancelar un lote de desembolso' })
  cancelBatch(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req['user'].id;
    return this.loanDisbursementService.cancelBatch(id, userId);
  }

  @Get('batch')
  @RequirePermissions('read:loan-disbursement-batch')
  @ApiOperation({ summary: 'Listar todos los lotes de desembolso de préstamos' })
  findAllBatches() {
    return this.loanDisbursementService.findAllDisbursementBatches();
  }

  @Get('batch/:id')
  @RequirePermissions('read:loan-disbursement-batch')
  @ApiOperation({ summary: 'Ver detalle de un lote de desembolso' })
  findOneBatch(@Param('id', ParseIntPipe) id: number) {
    return this.loanDisbursementService.findOneDisbursementBatch(id);
  }

  @Get('batch/:id/txt')
  @RequirePermissions('read:loan-disbursement-batch')
  @ApiOperation({
    summary:
      'Descargar el archivo TXT bancario del lote de desembolso de préstamos',
  })
  @ApiResponse({ status: 200, description: 'Archivo TXT generado exitosamente' })
  async downloadTxt(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { fileName, content } =
      await this.loanDisbursementService.generateTxtFile(id);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    res.send(content);
  }
}
