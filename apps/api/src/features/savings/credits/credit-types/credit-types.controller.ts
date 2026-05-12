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
import { CreditTypesService } from './credit-types.service';
import {
  CreateCreditTypeDto,
  UpdateCreditTypeDto,
} from './dto/credit-types.schema';
import { CreditTypePaginationDto } from './dto/pagination-credit-type.dto';

@Controller('savings-banks/credit-types')
export class CreditTypesController {
  constructor(
    private readonly creditTypesService: CreditTypesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'portfolio:credits-types',
    action: 'create',
    scope: 'global',
  })
  async create(@Req() req: Request, @Body() dto: CreateCreditTypeDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.creditTypesService.create(
      dto as Parameters<typeof this.creditTypesService.create>[0],
      targetTenantId,
      userId,
    );
  }

  @Get()
  @Permissions({
    resource: 'portfolio:credits-types',
    action: 'read',
    scope: 'global',
  })
  async findAll(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.creditTypesService.findAll(targetTenantId);
  }

  @Get('paginated')
  @Permissions({
    resource: 'portfolio:credits-types',
    action: 'read',
    scope: 'global',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: CreditTypePaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    return this.creditTypesService.findAllByPagination(
      targetTenantId,
      paginationDto,
    );
  }

  @Get(':id')
  @Permissions({
    resource: 'portfolio:credits-types',
    action: 'read',
    scope: 'global',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.creditTypesService.findOne(id, targetTenantId);
  }

  @Patch(':id')
  @Permissions({
    resource: 'portfolio:credits-types',
    action: 'update',
    scope: 'global',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCreditTypeDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.creditTypesService.update(
      id,
      dto as Parameters<typeof this.creditTypesService.update>[1],
      targetTenantId,
      userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    resource: 'portfolio:credits-types',
    action: 'delete',
    scope: 'global',
  })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.creditTypesService.remove(id, targetTenantId, userId);
  }
}
