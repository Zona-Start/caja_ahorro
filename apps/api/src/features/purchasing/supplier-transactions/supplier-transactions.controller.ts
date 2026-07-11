import { TenantContextService } from '@/common/services/tenant-context.service';
import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SupplierTransactionsService } from './supplier-transactions.service';

@ApiTags('administration/supplier-transactions')
@Controller('administration/supplier-transactions')
export class SupplierTransactionsController {
  constructor(
    private readonly services: SupplierTransactionsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

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
