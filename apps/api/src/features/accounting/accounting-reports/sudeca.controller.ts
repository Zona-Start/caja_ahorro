import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  SUDECA_REPORT_TYPES,
  SudecaDto,
  SudecaSchema,
  type SudecaReportType,
} from './dto/sudeca.dto';
import { SudecaService } from './services/sudeca.service';

@ApiTags('accounting-reports')
@Controller('accounting-reports/sudeca')
export class SudecaController {
  constructor(
    private readonly sudecaService: SudecaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get(':type/pdf')
  @ApiOperation({ summary: 'Download Sudeca report PDF' })
  async downloadPdf(
    @Param('type') type: string,
    @Query(new ZodValidatorPipe(SudecaSchema)) filters: SudecaDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const reportType = this.validateType(type);
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.sudecaService.generatePdf(
      targetTenantId,
      reportType,
      filters,
    );
    const today = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=sudeca_${reportType}_${today}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get(':type')
  @ApiOperation({ summary: 'Get Sudeca report data' })
  async getData(
    @Param('type') type: string,
    @Query(new ZodValidatorPipe(SudecaSchema)) filters: SudecaDto,
    @Req() req: Request,
  ) {
    const reportType = this.validateType(type);
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    return this.sudecaService.getData(targetTenantId, reportType, filters);
  }

  private validateType(type: string): SudecaReportType {
    if (!SUDECA_REPORT_TYPES.includes(type as SudecaReportType)) {
      throw new BadRequestException(`Tipo de reporte Sudeca inválido: ${type}`);
    }
    return type as SudecaReportType;
  }
}
