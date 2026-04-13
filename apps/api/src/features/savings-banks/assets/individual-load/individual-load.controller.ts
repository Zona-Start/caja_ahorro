import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
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
import { Response } from 'express';
import {
  BulkIndividualLoadDto,
  IndividualLoadDto,
} from './dto/create-individual-load.dto';
import { IndividualLoadService } from './individual-load.service';

@ApiTags('savings-banks/individual-load')
@Controller('savings-banks/individual-load')
export class IndividualLoadController {
  constructor(private readonly individualLoadService: IndividualLoadService) {}

  @Post()
  @RequirePermissions('create:individual-load')
  @ApiOperation({ summary: 'Create a new individual Load' })
  @ApiResponse({
    status: 201,
    description: 'Individual Load successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'A individual load with this description already exists.',
  })
  create(@Req() req: Request, @Body() individualLoadDto: IndividualLoadDto) {
    const userdId = req['user'].id;
    return this.individualLoadService.create(individualLoadDto, userdId);
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
  @RequirePermissions('create:individual-load')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload excel file for bulk load' })
  async createBulk(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: BulkIndividualLoadDto,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo es requerido');
    }
    const userId = req['user'].id;
    return this.individualLoadService.createBulk(file.buffer, dto, userId);
  }
}
