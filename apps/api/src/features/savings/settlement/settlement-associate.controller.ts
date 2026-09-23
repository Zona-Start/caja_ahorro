import { PaginationDto } from '@/common/dto/pagination.dto';
import { Permissions } from '@/common/decorators/permissions.decorator';
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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import {
  CreateBulkSettlementAssociateDto,
  CreateBulkSettlementAssociateSchema,
  CreateSettlementAssociateSchema,
  DisburseSettlementAssociateSchema,
  FilterSettlementAssociateDto,
} from './dto/settlement.schema';
import { SettlementAssociateService } from './settlement-associate.service';

@ApiTags('Settlement Associate')
@Controller('savings-banks/settlement-associate')
export class SettlementAssociateController {
  constructor(
    private readonly service: SettlementAssociateService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('download-template')
  @Permissions('savings:liquidations:mass_upload')
  @ApiOperation({ summary: 'Descargar plantilla de carga masiva' })
  @ApiResponse({
    status: 200,
    description: 'Plantilla Excel generada exitosamente.',
  })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.service.downloadTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="plantilla-liquidaciones.xlsx"',
    });
    res.send(buffer);
  }

  @Post('bulk')
  @Permissions('savings:liquidations:mass_upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Carga masiva de solicitudes de liquidacion' })
  @ApiResponse({
    status: 201,
    description: 'Resultado de la carga masiva con exitos y errores.',
  })
  bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Body(new ZodValidatorPipe(CreateBulkSettlementAssociateSchema))
    dto: CreateBulkSettlementAssociateDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.bulkUpload(targetTenantId, userId, file, dto);
  }

  @Get('request/:cedula')
  @ApiOperation({ summary: 'Obtener datos de liquidacion de un asociado' })
  @ApiResponse({
    status: 200,
    description: 'Datos de liquidacion retornados exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Asociado no encontrado.' })
  findOneRequest(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findOneRequest(targetTenantId, cedula);
  }

  @Post()
  @ApiOperation({ summary: 'Crear solicitud de liquidacion' })
  @ApiResponse({
    status: 201,
    description: 'La solicitud de liquidacion ha sido creada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  createRequest(
    @Req() req: Request,
    @Body(new ZodValidatorPipe(CreateSettlementAssociateSchema)) dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.create(targetTenantId, userId, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprobar y procesar liquidacion' })
  @ApiResponse({
    status: 200,
    description: 'La liquidacion ha sido procesada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Liquidacion no encontrada.' })
  approveRequest(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req);
    return this.service.approve(targetTenantId, userId, id);
  }

  @Post(':id/disburse')
  @ApiOperation({ summary: 'Registrar desembolso de liquidacion procesada' })
  @ApiResponse({
    status: 200,
    description: 'El desembolso ha sido registrado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Liquidacion no encontrada o no en estado PROCESADO.',
  })
  disburseRequest(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidatorPipe(DisburseSettlementAssociateSchema)) dto: any,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.service.disburse(targetTenantId, userId, id, dto);
  }

  @Get('approved')
  @ApiOperation({ summary: 'Obtener liquidaciones aprobadas' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todas las liquidaciones aprobadas.',
  })
  findSettlementAprovee(
    @Req() req: Request,
    @Query() paginationDto: PaginationDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findSettlementAprovee(targetTenantId, paginationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las liquidaciones',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna todas las liquidaciones con paginacion.',
  })
  findAll(
    @Req() req: Request,
    @Query() paginationDto: FilterSettlementAssociateDto,
  ) {
    const { targetTenantId } = this.tenantContextService.getTenantContext(req);
    return this.service.findAll(targetTenantId, paginationDto);
  }
}
