import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WithdrawalTypePaginationDto } from './dto/pagination-withdrawal-type.dto';
import {
  CreateWithdrawalTypeDto,
  UpdateWithdrawalTypeDto,
} from './dto/withdrawal-types.schema';
import { WithdrawalTypesService } from './withdrawal-types.service';

@Controller('savings-banks/withdrawal-types')
export class WithdrawalTypesController {
  constructor(
    private readonly withdrawalTypesService: WithdrawalTypesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'savings:withdrawal-types',
    action: 'create',
    scope: 'tenant',
  })
  async create(@Req() req: Request, @Body() dto: CreateWithdrawalTypeDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.withdrawalTypesService.create(
      dto as Parameters<typeof this.withdrawalTypesService.create>[0],
      targetTenantId,
      userId,
    );
  }

  @Get()
  @Permissions({
    resource: 'savings:withdrawal-types',
    action: 'read',
    scope: 'tenant',
  })
  async findAll(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.withdrawalTypesService.findAll(targetTenantId);
  }

  @Get('paginated')
  @Permissions({
    resource: 'savings:withdrawal-types',
    action: 'read',
    scope: 'tenant',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: WithdrawalTypePaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    return this.withdrawalTypesService.findAllByPagination(
      targetTenantId,
      paginationDto,
    );
  }

  @Get(':id')
  @Permissions({
    resource: 'savings:withdrawal-types',
    action: 'read',
    scope: 'tenant',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.withdrawalTypesService.findOne(id, targetTenantId);
  }

  @Patch(':id')
  @Permissions({
    resource: 'savings:withdrawal-types',
    action: 'update',
    scope: 'tenant',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWithdrawalTypeDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.withdrawalTypesService.update(
      id,
      dto as Parameters<typeof this.withdrawalTypesService.update>[1],
      targetTenantId,
      userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    resource: 'savings:withdrawal-types',
    action: 'delete',
    scope: 'tenant',
  })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.withdrawalTypesService.remove(id, targetTenantId, userId);
  }
}
