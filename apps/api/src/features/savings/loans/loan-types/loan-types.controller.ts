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
import { CreateLoanTypeDto, UpdateLoanTypeDto } from './dto/loan-types.schema';
import { LoanTypePaginationDto } from './dto/pagination-loan-type.dto';
import { LoanTypesService } from './loan-types.service';

@Controller('savings-banks/loan-types')
export class LoanTypesController {
  constructor(
    private readonly loanTypesService: LoanTypesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'portfolio:loans-types',
    action: 'create',
    scope: 'global',
  })
  async create(@Req() req: Request, @Body() dto: CreateLoanTypeDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.loanTypesService.create(
      dto as Parameters<typeof this.loanTypesService.create>[0],
      targetTenantId,
      userId,
    );
  }

  @Get()
  @Permissions({
    resource: 'portfolio:loans-types',
    action: 'read',
    scope: 'global',
  })
  async findAll(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanTypesService.findAll(targetTenantId);
  }

  @Get('paginated')
  @Permissions({
    resource: 'portfolio:loans-types',
    action: 'read',
    scope: 'global',
  })
  async findAllPaginated(
    @Req() req: Request,
    @Query() paginationDto: LoanTypePaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      paginationDto,
    );
    return this.loanTypesService.findAllByPagination(
      targetTenantId,
      paginationDto,
    );
  }

  @Get(':id')
  @Permissions({
    resource: 'portfolio:loans-types',
    action: 'read',
    scope: 'global',
  })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.loanTypesService.findOne(id, targetTenantId);
  }

  @Patch(':id')
  @Permissions({
    resource: 'portfolio:loans-types',
    action: 'update',
    scope: 'global',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLoanTypeDto,
    @Req() req: Request,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.loanTypesService.update(
      id,
      dto as Parameters<typeof this.loanTypesService.update>[1],
      targetTenantId,
      userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    resource: 'portfolio:loans-types',
    action: 'delete',
    scope: 'global',
  })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.loanTypesService.remove(id, targetTenantId, userId);
  }
}
