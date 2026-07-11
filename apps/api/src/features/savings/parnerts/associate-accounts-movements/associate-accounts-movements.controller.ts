import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssociateAccountsMovementsService } from './associate-accounts-movements.service';
import {
  CreateAssociateAccountMovementSchema,
  FilterMovementsSchema,
} from './dto/movements.schema';

@Controller('savings-banks/associate-accounts-movements')
export class AssociateAccountsMovementsController {
  constructor(
    private readonly service: AssociateAccountsMovementsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('haberes/by-associate/:associateId')
  @UsePipes(new ZodValidatorPipe(FilterMovementsSchema))
  @ApiOperation({ summary: 'Get all haberes movements for an associate' })
  @ApiResponse({
    status: 200,
    description: 'Return all haberes movements for the associate.',
  })
  async findAllHaberesByAssociate(
    @Req() req: any,
    @Param('associateId') associateId: string,
    @Query() filtersDto: any,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findAllHaberesByAssociate(
      associateId,
      filtersDto,
      targetTenantId,
    );

    return {
      message: 'Haberes movements fetched successfully.',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('history/by-associate/:associateId')
  @UsePipes(new ZodValidatorPipe(FilterMovementsSchema))
  @ApiOperation({ summary: 'Get all transaction history for an associate' })
  @ApiResponse({
    status: 200,
    description: 'Return all transaction history for the associate.',
  })
  async findAllTransactionsByAssociate(
    @Req() req: any,
    @Param('associateId') associateId: string,
    @Query() filtersDto: any,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const result = await this.service.findAllByAssociate(
      associateId,
      filtersDto,
      targetTenantId,
    );
    return {
      message: 'Transaction history fetched successfully.',
      data: result.data,
      meta: result.meta,
    };
  }

  @Post()
  @UsePipes(new ZodValidatorPipe(CreateAssociateAccountMovementSchema))
  @ApiOperation({ summary: 'Create a new associate account movement' })
  @ApiResponse({
    status: 201,
    description: 'Associate Accounts Movement created successfully.',
  })
  create(@Req() req: any, @Body() dto: any) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.create(userId, dto, targetTenantId);
  }
}
