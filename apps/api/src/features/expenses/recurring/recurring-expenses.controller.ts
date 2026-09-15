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
import {
  CreateRecurringExpenseTemplateDto,
  FilterRecurringExpenseTemplateDto,
  UpdateRecurringExpenseTemplateDto,
} from './dto/recurring-expense-templates.schema';
import { RecurringExpenseTemplatesService } from './recurring-expense-templates.service';

@ApiTags('expenses/recurring')
@Controller('recurring-expenses')
export class RecurringExpensesController {
  constructor(
    private readonly service: RecurringExpenseTemplatesService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @Permissions({
    resource: 'treasury:recurring-expenses',
    action: 'create',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Create a recurring expense template' })
  async create(
    @Req() req: any,
    @Body() dto: CreateRecurringExpenseTemplateDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.create(userId, targetTenantId, dto);
    return { message: 'Plantilla recurrente creada correctamente', data };
  }

  @Get('/paginated')
  @Permissions({
    resource: 'treasury:recurring-expenses',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get paginated recurring templates' })
  async findAllByPagination(
    @Req() req: any,
    @Query() dto: FilterRecurringExpenseTemplateDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );
    const result = await this.service.findAllByPagination(targetTenantId, dto);
    return {
      message: 'Plantillas recurrentes obtenidas correctamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions({
    resource: 'treasury:recurring-expenses',
    action: 'read',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Get a recurring template by ID' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    const data = await this.service.findOne(id, targetTenantId);
    return { message: 'Plantilla recurrente obtenida correctamente', data };
  }

  @Patch(':id')
  @Permissions({
    resource: 'treasury:recurring-expenses',
    action: 'update',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Update a recurring template' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringExpenseTemplateDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    const data = await this.service.update(id, userId, targetTenantId, dto);
    return { message: 'Plantilla recurrente actualizada correctamente', data };
  }

  @Delete(':id')
  @Permissions({
    resource: 'treasury:recurring-expenses',
    action: 'delete',
    scope: 'tenant',
  })
  @ApiOperation({ summary: 'Deactivate a recurring template' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return await this.service.remove(id, userId, targetTenantId);
  }
}
