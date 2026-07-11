import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ReqLogInterceptor } from 'src/common/interceptors/req-log.interceptor';
import { ZodValidatorPipe } from 'src/common/pipes/zod-validator.pipe';
import { TenantContextService } from 'src/common/services/tenant-context.service';
import { AssociateInquiryService } from './associate-inquiry.service';
import {
  InquiryStatementFilterDto,
  InquiryStatementFilterSchema,
} from './dto/inquiry-filter.zod.dto';

@ApiTags('savings-banks/associates/inquiry')
@UseInterceptors(ReqLogInterceptor)
@Controller('savings-banks/associates/inquiry')
export class AssociateInquiryController {
  constructor(
    private readonly inquiryService: AssociateInquiryService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('statement')
  @ApiOperation({ summary: 'Obtener estado de cuenta completo del asociado' })
  @ApiQuery({ name: 'cedula', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Estado de cuenta del asociado.' })
  @ApiResponse({ status: 404, description: 'Asociado no encontrado.' })
  @UsePipes(new ZodValidatorPipe(InquiryStatementFilterSchema))
  async getStatement(
    @Req() req: Request,
    @Query() query: InquiryStatementFilterDto,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.inquiryService.getStatement(
      targetTenantId,
      query.cedula,
    );
    return { message: 'Estado de cuenta obtenido exitosamente', data };
  }

  @Get('haberes/:associateId')
  @ApiOperation({ summary: 'Haberes (aportes) del asociado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista paginada de haberes.' })
  async getHaberes(
    @Req() req: Request,
    @Param('associateId') associateId: string,
    @Query() query: any,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const data = await this.inquiryService.getHaberes(
      targetTenantId,
      associateId,
      page,
      limit,
      query.search,
    );
    return { message: 'Haberes obtenidos exitosamente', ...data };
  }

  @Get('retiros/:associateId')
  @ApiOperation({ summary: 'Retiros del asociado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de retiros.' })
  async getRetiros(
    @Req() req: Request,
    @Param('associateId') associateId: string,
    @Query() query: any,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const data = await this.inquiryService.getRetiros(
      targetTenantId,
      associateId,
      page,
      limit,
      query.search,
    );
    return { message: 'Retiros obtenidos exitosamente', ...data };
  }

  @Get('prestamos/:associateId')
  @ApiOperation({ summary: 'Préstamos del asociado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de préstamos.' })
  async getPrestamos(
    @Req() req: Request,
    @Param('associateId') associateId: string,
    @Query() query: any,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const data = await this.inquiryService.getPrestamos(
      targetTenantId,
      associateId,
      page,
      limit,
      query.search,
    );
    return { message: 'Préstamos obtenidos exitosamente', ...data };
  }

  @Get('creditos/:associateId')
  @ApiOperation({ summary: 'Créditos del asociado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de créditos.' })
  async getCreditos(
    @Req() req: Request,
    @Param('associateId') associateId: string,
    @Query() query: any,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const data = await this.inquiryService.getCreditos(
      targetTenantId,
      associateId,
      page,
      limit,
      query.search,
    );
    return { message: 'Créditos obtenidos exitosamente', ...data };
  }

  @Get('historial/:associateId')
  @ApiOperation({ summary: 'Historial de movimientos del asociado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada del historial de movimientos.',
  })
  async getHistorial(
    @Req() req: Request,
    @Param('associateId') associateId: string,
    @Query() query: any,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const data = await this.inquiryService.getHistorial(
      targetTenantId,
      associateId,
      page,
      limit,
      query.search,
    );
    return { message: 'Historial obtenido exitosamente', ...data };
  }

  @Get('prestamo/:loanId/detalle')
  @ApiOperation({ summary: 'Detalle de un préstamo' })
  @ApiResponse({ status: 200, description: 'Detalle del préstamo.' })
  @ApiResponse({ status: 404, description: 'Préstamo no encontrado.' })
  async getPrestamoDetalle(
    @Req() req: Request,
    @Param('loanId') loanId: string,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.inquiryService.getPrestamoDetalle(
      targetTenantId,
      loanId,
    );
    return { message: 'Detalle del préstamo obtenido exitosamente', data };
  }

  @Get('credito/:creditId/detalle')
  @ApiOperation({ summary: 'Detalle de un crédito' })
  @ApiResponse({ status: 200, description: 'Detalle del crédito.' })
  @ApiResponse({ status: 404, description: 'Crédito no encontrado.' })
  async getCreditoDetalle(
    @Req() req: Request,
    @Param('creditId') creditId: string,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.inquiryService.getCreditoDetalle(
      targetTenantId,
      creditId,
    );
    return { message: 'Detalle del crédito obtenido exitosamente', data };
  }

  @Get('retiro/:withdrawalId/detalle')
  @ApiOperation({ summary: 'Detalle de un retiro' })
  @ApiResponse({ status: 200, description: 'Detalle del retiro.' })
  @ApiResponse({ status: 404, description: 'Retiro no encontrado.' })
  async getRetiroDetalle(
    @Req() req: Request,
    @Param('withdrawalId') withdrawalId: string,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.inquiryService.getRetiroDetalle(
      targetTenantId,
      withdrawalId,
    );
    return { message: 'Detalle del retiro obtenido exitosamente', data };
  }
}
