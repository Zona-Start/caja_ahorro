import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSaleDto, FilterSaleDto } from './dto/sales-invoices.schema';
import { SalesInvoicesService } from './sales-invoices.service';

@ApiTags('sales/invoices')
@Controller('sales/invoices')
export class SalesInvoicesController {
  constructor(
    private readonly invoicesService: SalesInvoicesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({ resource: 'sales:invoices', action: 'create', scope: 'tenant' })
  @ApiOperation({ summary: 'Register a sale (cash or credit)' })
  async create(@Req() req: any, @Body() dto: CreateSaleDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.invoicesService.create(targetTenantId, userId, dto);
  }

  @Get('/paginated')
  @Permissions({ resource: 'sales:invoices', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'List sales invoices with pagination' })
  async findAll(@Req() req: any, @Query() dto: FilterSaleDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.invoicesService.findAllByPagination(targetTenantId, dto);
  }

  @Get(':id')
  @Permissions({ resource: 'sales:invoices', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'Get a sales invoice by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.invoicesService.findOne(id, targetTenantId);
    return { message: 'Factura obtenida correctamente', data };
  }

  @Post(':id/delivery-note')
  @Permissions({
    resource: 'sales:delivery-notes',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Generate a delivery note from an invoice' })
  async generateDeliveryNote(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.invoicesService.generateDeliveryNote(id, targetTenantId, userId);
  }

  @Patch(':id/cancel')
  @Permissions({ resource: 'sales:invoices', action: 'delete', scope: 'tenant' })
  @ApiOperation({ summary: 'Cancel a sales invoice' })
  async cancel(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.invoicesService.cancel(id, targetTenantId, userId);
  }
}
