import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveryNotesService } from './delivery-notes.service';
import {
  CreateDeliveryNoteDto,
  FilterDeliveryNoteDto,
} from './dto/delivery-notes.schema';

@ApiTags('sales/delivery-notes')
@Controller('sales/delivery-notes')
export class DeliveryNotesController {
  constructor(
    private readonly deliveryNotesService: DeliveryNotesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'sales:delivery-notes',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Create a delivery note' })
  async create(@Req() req: any, @Body() dto: CreateDeliveryNoteDto) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.deliveryNotesService.create(targetTenantId, userId, dto);
  }

  @Get('/paginated')
  @Permissions({
    resource: 'sales:delivery-notes',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'List delivery notes with pagination' })
  async findAll(@Req() req: any, @Query() dto: FilterDeliveryNoteDto) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.deliveryNotesService.findAllByPagination(targetTenantId, dto);
  }

  @Get(':id')
  @Permissions({
    resource: 'sales:delivery-notes',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get a delivery note by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.deliveryNotesService.findOne(id, targetTenantId);
    return { message: 'Nota de entrega obtenida correctamente', data };
  }
}
