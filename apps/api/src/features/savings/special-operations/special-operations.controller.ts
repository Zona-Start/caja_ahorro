import { Permissions } from '@/common/decorators/permissions.decorator';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import {
  ExecuteSpecialOperationSchema,
  FilterSpecialOperationDto,
  FilterSpecialOperationSchema,
  PreviewSpecialOperationSchema,
  SaveSpecialOperationAccountConfigSchema,
  SpecialOperationType,
} from './dto/special-operations.schema';
import { SpecialOperationsService } from './special-operations.service';

const OPERATION_TYPES: SpecialOperationType[] = [
  'LIQUIDATION_VS_INCOME',
  'LOAN_WITHDRAWAL_VS_SAVINGS',
];

@ApiTags('Special Operations')
@Controller('savings-banks/special-operations')
export class SpecialOperationsController {
  constructor(
    private readonly service: SpecialOperationsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('template')
  @Permissions('savings:special-operations:read')
  @ApiOperation({
    summary: 'Descargar plantilla de operaciones especiales',
  })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.service.generateTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="plantilla-operaciones-especiales.xlsx"',
    });
    res.send(buffer);
  }

  @Post('preview')
  @Permissions('savings:special-operations:create')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({
    summary: 'Cargar Excel y obtener la vista previa de la operación',
  })
  preview(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Body(new ZodValidatorPipe(PreviewSpecialOperationSchema)) dto: any,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo es requerido.');
    }

    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
      dto,
    );

    return this.service.preview(
      targetTenantId,
      dto.operationType,
      file,
      dto.operationDate,
    );
  }

  @Get('account-config/:operationType')
  @Permissions('savings:special-operations:config')
  @ApiOperation({
    summary: 'Obtener la configuración contable de una operación especial',
  })
  getConfig(
    @Req() req: Request,
    @Param('operationType') operationType: string,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
    );
    return this.service.getConfig(
      targetTenantId,
      this.parseOperationType(operationType),
    );
  }

  @Get('accounts')
  @Permissions('savings:special-operations:config')
  @ApiOperation({
    summary:
      'Listar cuentas contables imputables para configurar la operación',
  })
  getAccounts(@Req() req: Request) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
    );
    return this.service.getAccounts(targetTenantId);
  }

  @Put('account-config/:operationType')
  @Permissions('savings:special-operations:config')
  @ApiOperation({
    summary: 'Guardar la configuración contable de una operación especial',
  })
  saveConfig(
    @Req() req: Request,
    @Param('operationType') operationType: string,
    @Body(new ZodValidatorPipe(SaveSpecialOperationAccountConfigSchema))
    dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);

    return this.service.saveConfig(
      targetTenantId,
      userId,
      this.parseOperationType(operationType),
      dto.details,
    );
  }

  @Post('execute')
  @Permissions('savings:special-operations:execute')
  @ApiOperation({ summary: 'Ejecutar una operación especial' })
  execute(
    @Req() req: Request,
    @Body(new ZodValidatorPipe(ExecuteSpecialOperationSchema)) dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);

    return this.service.execute(targetTenantId, userId, dto);
  }

  @Get()
  @Permissions('savings:special-operations:read')
  @ApiOperation({ summary: 'Listar operaciones especiales' })
  findAll(
    @Req() req: Request,
    @Query(new ZodValidatorPipe(FilterSpecialOperationSchema))
    paginationDto: FilterSpecialOperationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
    );
    return this.service.findAll(targetTenantId, paginationDto);
  }

  @Get(':id')
  @Permissions('savings:special-operations:read')
  @ApiOperation({ summary: 'Obtener el detalle de una operación especial' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(
      req,
    );
    return this.service.findOne(targetTenantId, id);
  }

  private parseOperationType(value: string): SpecialOperationType {
    if (!OPERATION_TYPES.includes(value as SpecialOperationType)) {
      throw new BadRequestException(
        `Tipo de operación especial inválido: ${value}`,
      );
    }
    return value as SpecialOperationType;
  }
}
