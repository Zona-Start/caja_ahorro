import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  FilterCustomerDto,
  UpdateCustomerDto,
} from './dto/customers.schema';

@ApiTags('sales/customers')
@Controller('sales/customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({ resource: 'sales:customers', action: 'create', scope: 'tenant' })
  @ApiOperation({ summary: 'Create a customer' })
  async create(@Req() req: any, @Body() dto: CreateCustomerDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.customersService.create(targetTenantId, userId, dto);
  }

  @Get('/paginated')
  @Permissions({ resource: 'sales:customers', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'List customers with pagination' })
  async findAll(@Req() req: any, @Query() dto: FilterCustomerDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.customersService.findAllByPagination(targetTenantId, dto);
  }

  @Get('/all')
  @Permissions({ resource: 'sales:customers', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'List all active customers' })
  async findAllActive(@Req() req: any) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.customersService.findAllActive(targetTenantId);
    return { message: 'Clientes obtenidos correctamente', data };
  }

  @Get(':id')
  @Permissions({ resource: 'sales:customers', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'Get a customer by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.customersService.findOne(id, targetTenantId);
    return { message: 'Cliente obtenido correctamente', data };
  }

  @Patch(':id')
  @Permissions({ resource: 'sales:customers', action: 'update', scope: 'tenant' })
  @ApiOperation({ summary: 'Update a customer' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.customersService.update(id, targetTenantId, userId, dto);
  }

  @Patch(':id/toggle-status')
  @Permissions({ resource: 'sales:customers', action: 'update', scope: 'tenant' })
  @ApiOperation({ summary: 'Toggle customer active status' })
  async toggleStatus(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.customersService.toggleStatus(id, targetTenantId, userId);
  }

  @Delete(':id')
  @Permissions({ resource: 'sales:customers', action: 'delete', scope: 'tenant' })
  @ApiOperation({ summary: 'Deactivate a customer' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.customersService.toggleStatus(id, targetTenantId, userId);
  }
}
