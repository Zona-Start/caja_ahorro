import { ReqLogInterceptor } from '@/common/interceptors/req-log.interceptor';
import { ZodValidatorPipe } from '@/common/pipes/zod-validator.pipe';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import {
  BulkIndividualLoadDto,
  BulkIndividualLoadSchema,
  CreateIndividualLoadDto,
  CreateIndividualLoadSchema,
} from './dto/individual-load.zod.dto';
import { IndividualLoadService } from './individual-load.service';

@ApiTags('savings-banks/individual-load')
@Controller('savings-banks/individual-load')
@UseInterceptors(ReqLogInterceptor)
export class IndividualLoadController {
  constructor(
    private readonly individualLoadService: IndividualLoadService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new individual Load' })
  @ApiResponse({
    status: 201,
    description: 'Individual Load successfully created.',
  })
  create(
    @Req() req: Request,
    @Body(new ZodValidatorPipe(CreateIndividualLoadSchema))
    dto: CreateIndividualLoadDto,
  ) {
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.individualLoadService.create(targetTenantId, userId, dto);
  }

  @Get('template-bulk')
  @ApiOperation({ summary: 'Download template for bulk load' })
  async getTemplateBulk(@Res() res: Response) {
    const buffer = await this.individualLoadService.generateTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="plantilla_carga_masiva.xlsx"',
    });
    res.end(buffer);
  }

  @Post('bulk')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Upload excel file for bulk load' })
  async createBulk(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidatorPipe(BulkIndividualLoadSchema))
    dto: BulkIndividualLoadDto,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo es requerido');
    }
    const { targetTenantId, userId } =
      this.tenantContextService.getTenantContext(req, dto);
    return this.individualLoadService.createBulk(
      targetTenantId,
      userId,
      file.buffer,
      dto,
    );
  }
}
