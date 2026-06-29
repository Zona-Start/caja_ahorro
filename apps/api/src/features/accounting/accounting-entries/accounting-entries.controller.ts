import { Permissions } from '@/common/decorators/permissions.decorator';
import { ReqLogInterceptor } from '@/common/interceptors';
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
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AccountingEntriesService } from './accounting-entries.service';
import { CreateAccountingEntryDto } from './dto/create-accounting-entry.dto';
import { FilterAccountingEntryDto } from './dto/filter-accounting-entry.dto';
import { UpdateAccountingEntryDto } from './dto/update-accounting-entry.dto';

@ApiTags('accounting/entries')
@UseInterceptors(ReqLogInterceptor)
@Controller('accounting/entries')
export class AccountingEntriesController {
  constructor(
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly tenantContext: TenantContextService,
  ) { }

  @Post()
  @Permissions({ resource: 'accounting:journal_entries', action: 'create', scope: 'tenant' })
  @ApiOperation({ summary: 'Crear un nuevo asiento contable (Borrador)' })
  @ApiResponse({
    status: 201,
    description: 'Asiento contable creado exitosamente.',
  })
  async create(@Req() req: Request, @Body() dto: CreateAccountingEntryDto) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    const data = await this.accountingEntriesService.create(
      userId,
      targetTenantId,
      dto,
    );
    return { message: 'Asiento contable creado exitosamente', data };
  }

  @Get()
  @Permissions({ resource: 'accounting:journal_entries', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'Obtener todos los asientos contables con paginación' })
  async findAllPaginated(
    @Req() req: Request,
    @Query() dto: FilterAccountingEntryDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req, dto);
    const result = await this.accountingEntriesService.findAllPaginated(
      targetTenantId,
      dto,
    );
    return {
      message: 'Asientos contables obtenidos exitosamente',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Permissions({ resource: 'accounting:journal_entries', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'Obtener un asiento contable por ID' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.accountingEntriesService.findOne(
      targetTenantId,
      id,
    );
    return { message: 'Asiento contable obtenido exitosamente', data };
  }

  @Patch(':id')
  @Permissions({ resource: 'accounting:journal_entries', action: 'update', scope: 'tenant' })
  @ApiOperation({ summary: 'Actualizar un asiento contable' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateAccountingEntryDto,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    const data = await this.accountingEntriesService.update(
      userId,
      targetTenantId,
      id,
      dto,
    );
    return { message: 'Asiento contable actualizado exitosamente', data };
  }

  @Delete(':id')
  @Permissions({ resource: 'accounting:journal_entries', action: 'delete', scope: 'tenant' })
  @ApiOperation({ summary: 'Eliminar un asiento contable' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(req);
    return await this.accountingEntriesService.remove(
      userId,
      targetTenantId,
      id,
    );
  }

  @Post(':id/submit')
  @Permissions({ resource: 'accounting:journal_entries', action: 'update', scope: 'tenant' })
  @ApiOperation({ summary: 'Enviar asiento (Borrador → Pendiente)' })
  async submit(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(req);
    const data = await this.accountingEntriesService.submitEntry(
      userId,
      targetTenantId,
      id,
    );
    return { message: 'Asiento enviado exitosamente', data };
  }

  @Post(':id/post')
  @Permissions({ resource: 'accounting:journal_entries', action: 'update', scope: 'tenant' })
  @ApiOperation({ summary: 'Contabilizar asiento (Pendiente → Contabilizado)' })
  async post(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(req);
    const data = await this.accountingEntriesService.postEntry(
      userId,
      targetTenantId,
      id,
    );
    return { message: 'Asiento contabilizado exitosamente', data };
  }

  @Post(':id/cancel')
  @Permissions({ resource: 'accounting:journal_entries', action: 'update', scope: 'tenant' })
  @ApiOperation({ summary: 'Anular asiento (Contabilizado → Anulado) y crear reverso' })
  async cancel(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(req);
    const data = await this.accountingEntriesService.cancelEntry(
      userId,
      targetTenantId,
      id,
    );
    return {
      message: 'Asiento anulado y revertido exitosamente',
      data,
    };
  }

  @Post('validate')
  @Permissions({ resource: 'accounting:journal_entries', action: 'read', scope: 'tenant' })
  @ApiOperation({ summary: 'Validar cuadre de un asiento sin guardar' })
  async validateEntry(
    @Req() req: Request,
    @Body() dto: CreateAccountingEntryDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req, dto);
    const data = await this.accountingEntriesService.validateDto(
      targetTenantId,
      dto,
    );
    return { message: 'Validación exitosa', data };
  }
}
