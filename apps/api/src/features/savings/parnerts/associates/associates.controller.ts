import { ReqLogInterceptor } from '@/common/interceptors/req-log.interceptor';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
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
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { AssociatesService } from './associates.service';
import { CreateAssociateAccountsSchema } from './dto/create-associate-accounts.dto';
import {
  CreateAssociateSchema,
  UpdateAssociateSchema,
} from './dto/create-associate.zod.dto';
import {
  FilterAssociateDto,
  FilterAssociateSchema,
} from './dto/filter-associate.zod.dto';

@ApiTags('savings-banks/associates')
@UseInterceptors(ReqLogInterceptor)
@Controller('savings-banks/associates')
export class AssociatesController {
  constructor(
    private readonly associatesService: AssociatesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new associate' })
  @ApiResponse({ status: 201, description: 'Associate created successfully.' })
  @UsePipes(new ZodValidatorPipe(CreateAssociateSchema))
  async create(@Req() req: Request, @Body() dto: any) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    const data = await this.associatesService.create(
      targetTenantId,
      userId,
      dto,
    );
    return { message: 'Associate created successfully', data };
  }

  @Post('bulk-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const isExcel =
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls');
        if (!isExcel) {
          return cb(
            new Error('Solo se permiten archivos Excel (.xlsx, .xls)'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Carga masiva de asociados desde un archivo Excel' })
  @ApiResponse({ status: 201, description: 'Carga masiva procesada.' })
  async bulkUpload(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(req);
    const result = await this.associatesService.bulkUpload(
      targetTenantId,
      userId,
      file.buffer,
    );
    return {
      message: 'Carga masiva procesada exitosamente',
      data: result,
    };
  }

  @Get('bulk-upload/template')
  @ApiOperation({ summary: 'Descargar template Excel para carga masiva' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.associatesService.generateTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_asociados.xlsx"',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Get all associates or filter by savings bank ID' })
  @ApiQuery({ name: 'savingsBankId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all associates.' })
  @UsePipes(new ZodValidatorPipe(FilterAssociateSchema))
  async findAll(@Req() req: Request, @Query() filterDto: FilterAssociateDto) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const result = await this.associatesService.findAll(
      targetTenantId,
      filterDto,
    );
    return {
      message: 'Associates fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('cedula/:cedula')
  @ApiOperation({ summary: 'Get an associate by cedula' })
  @ApiResponse({ status: 200, description: 'Return the associate.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async findByCedula(@Req() req: Request, @Param('cedula') cedula: string) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.associatesService.findByCedula(
      targetTenantId,
      cedula,
    );
    return { message: 'Associate fetched successfully', data };
  }

  @Get('details/:cedula')
  @ApiOperation({ summary: 'Get associate details by cedula' })
  @ApiResponse({ status: 200, description: 'Return the associate details.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async getAssociateDetailsByCedula(
    @Req() req: Request,
    @Param('cedula') cedula: string,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.associatesService.getAssociateDetailsByCedula(
      targetTenantId,
      cedula,
    );
    return { message: 'Associate details fetched successfully', data };
  }

  @Get('report/pdf')
  @ApiOperation({ summary: 'Download associates PDF report' })
  async downloadReportPdf(
    @Req() req: Request,
    @Query() filterDto: FilterAssociateDto,
    @Res() res: Response,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const pdfDoc = await this.associatesService.getReportsPdf(
      targetTenantId,
      filterDto,
    );
    const filename = `reporte_asociados_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an associate by ID' })
  @ApiResponse({ status: 200, description: 'Return the associate.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.associatesService.findOne(targetTenantId, id);
    return { message: 'Associate fetched successfully', data };
  }

  @Get(':id/accounts')
  @ApiOperation({ summary: 'Get an associate accounts by ID' })
  @ApiResponse({ status: 200, description: 'Return the associate accounts.' })
  @ApiResponse({ status: 404, description: 'Associate accounts not found.' })
  async findByIdAssociateAccounts(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    const data = await this.associatesService.findByIdAssociateAccounts(
      targetTenantId,
      id,
    );
    return { message: 'By ID Associate Accounts fetched successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an associate' })
  @ApiResponse({ status: 200, description: 'Associate updated successfully.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  @UsePipes(new ZodValidatorPipe(UpdateAssociateSchema))
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    const data = await this.associatesService.update(
      targetTenantId,
      userId,
      id,
      dto,
    );
    return { message: 'Associate updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an associate' })
  @ApiResponse({ status: 200, description: 'Associate deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(req);
    return await this.associatesService.remove(targetTenantId, userId, id);
  }

  @Post(':id/accounts')
  @ApiOperation({ summary: 'Create Associate Accounts' })
  @ApiResponse({
    status: 201,
    description: 'Associate Accounts created successfully.',
  })
  @UsePipes(new ZodValidatorPipe(CreateAssociateAccountsSchema))
  async createAccounts(@Req() req: Request, @Body() dto: any) {
    const { targetTenantId, userId } = this.tenantContext.getTenantContext(
      req,
      dto,
    );
    const data = await this.associatesService.createAssociateAccounts(
      targetTenantId,
      userId,
      dto,
    );
    return { message: 'Associate Accounts created successfully', data };
  }
}
