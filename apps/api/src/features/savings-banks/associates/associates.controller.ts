import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
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
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { AssociatesService } from './associates.service';
import { CreateAssociateAccountsDto } from './dto/create-associate-accounts.dto';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { FilterAssociateDto } from './dto/filter-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';

@ApiTags('savings-banks/associates')
@Controller('savings-banks/associates')
export class AssociatesController {
  constructor(private readonly associatesService: AssociatesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:associate')
  @ApiOperation({ summary: 'Create a new associate' })
  @ApiResponse({ status: 201, description: 'Associate created successfully.' })
  async create(
    @Req() req: Request,
    @Body() createAssociateDto: CreateAssociateDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.associatesService.create(
      userdId,
      createAssociateDto,
    );
    return { message: 'Associate created successfully', data };
  }

  // ─── Carga Masiva ───────────────────────────────────────────────────────────

  @Post('bulk-upload')
  @Roles('admin')
  @RequirePermissions('create:associate')
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
    const userId = req['user'].id;
    const result = await this.associatesService.bulkUpload(userId, file.buffer);
    return {
      message: 'Carga masiva procesada exitosamente',
      data: result,
    };
  }

  @Get('bulk-upload/template')
  @Roles('admin')
  @RequirePermissions('read:associates')
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

  // ─── Consultas ───────────────────────────────────────────────────────────────

  @Get()
  @Roles('admin')
  @RequirePermissions('read:associates')
  @ApiOperation({ summary: 'Get all associates or filter by savings bank ID' })
  @ApiQuery({ name: 'savingsBankId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all associates.' })
  async findAll(@Query() paginationDto: FilterAssociateDto) {
    const result = await this.associatesService.findAll(paginationDto);
    return {
      message: 'Associates fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('cedula/:cedula')
  @RequirePermissions('read:associate-by-cedula')
  @ApiOperation({ summary: 'Get an associate by cedula' })
  @ApiResponse({ status: 200, description: 'Return the associate.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async findByCedula(@Param('cedula') cedula: string) {
    const data = await this.associatesService.findByCedula(cedula);
    return { message: 'Associate fetched successfully', data };
  }

  @Get('details/:cedula')
  @RequirePermissions('read:associate-details-by-cedula')
  @ApiOperation({ summary: 'Get associate details by cedula' })
  @ApiResponse({ status: 200, description: 'Return the associate details.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async getAssociateDetailsByCedula(@Param('cedula') cedula: string) {
    const data =
      await this.associatesService.getAssociateDetailsByCedula(cedula);
    return { message: 'Associate details fetched successfully', data };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:associate')
  @ApiOperation({ summary: 'Get an associate by ID' })
  @ApiResponse({ status: 200, description: 'Return the associate.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.associatesService.findOne(+id);
    return { message: 'Associate fetched successfully', data };
  }

  // ─── Mutaciones ──────────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:associate')
  @ApiOperation({ summary: 'Update an associate' })
  @ApiResponse({ status: 200, description: 'Associate updated successfully.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateAssociateDto: UpdateAssociateDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.associatesService.update(
      userdId,
      +id,
      updateAssociateDto,
    );
    return { message: 'Associate updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:associate')
  @ApiOperation({ summary: 'Delete an associate' })
  @ApiResponse({ status: 200, description: 'Associate deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Associate not found.' })
  async remove(@Param('id') id: string) {
    return await this.associatesService.remove(+id);
  }

  // ─── Associate Accounts ──────────────────────────────────────────────────────

  @Get('/:id/accounts')
  @Roles('admin')
  @RequirePermissions('read:associate-account')
  @ApiOperation({ summary: 'Get an associate accounts by ID' })
  @ApiResponse({ status: 200, description: 'Return the associate accounts.' })
  @ApiResponse({ status: 404, description: 'Associate accounts not found.' })
  async findByIdAssociateAccounts(@Param('id') id: string) {
    const data = await this.associatesService.findByIdAssociateAccounts(+id);
    return { message: 'By ID Associate Accounts fetched successfully', data };
  }

  @Post('/:id/accounts')
  @Roles('admin')
  @RequirePermissions('create:associate-accounts')
  @ApiOperation({ summary: 'Create Associate Accounts' })
  @ApiResponse({
    status: 201,
    description: 'Associate Accounts created successfully.',
  })
  async createAccounts(
    @Req() req: Request,
    @Body() createAssociateAccountsDto: CreateAssociateAccountsDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.associatesService.createAssociateAccounts(
      userdId,
      createAssociateAccountsDto,
    );
    return { message: 'Associate Accounts created successfully', data };
  }
}
