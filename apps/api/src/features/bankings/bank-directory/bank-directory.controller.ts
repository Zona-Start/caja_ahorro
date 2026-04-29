import { PaginationDto } from '@/common/dto/pagination.dto';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { BankDirectoryService } from './bank-directory.services';
import { CreateBankDirectoryDto } from './dto/bank-directory.schema';
import { UpdateBankDirectoryDto } from './dto/update-bank-directory.dto';

@ApiTags('bakings/bank-directory')
@Controller('bakings/bank-directory')
export class BankDirectoryController {
  constructor(
    private readonly service: BankDirectoryService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bank directory' })
  @ApiResponse({
    status: 201,
    description: 'Bank directory successfully created.',
  })
  async create(@Req() req: Request, @Body() dto: CreateBankDirectoryDto) {
    const userId = this.tenantContextService.getUserId(req);
    const data = await this.service.create(userId, dto);
    return { message: 'Banks Directory created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all banks directory' })
  @ApiResponse({ status: 200, description: 'Return all banks.' })
  async findAll(@Req() req: Request) {
    const data = await this.service.findAll();
    return { message: 'Banks directory fetched successfully', data };
  }

  @Get('/paginated')
  @ApiOperation({
    summary: 'Get all banks directory with pagination',
  })
  @ApiResponse({ status: 200, description: 'Return paginated banks .' })
  async findAllByPagination(
    @Req() req: Request,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.service.findAllByPagination(paginationDto);
    return {
      message: 'banks directory fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a banks by ID' })
  @ApiResponse({ status: 200, description: 'Return the banks.' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { message: 'Bank directory fetched successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a banks' })
  @ApiResponse({ status: 200, description: 'banks updated successfully.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBankDirectoryDto,
    @Req() req: Request,
  ) {
    const userId = this.tenantContextService.getUserId(req);
    const data = await this.service.update(userId, id.toString(), dto);
    return { message: 'Bank updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a banks' })
  @ApiResponse({ status: 200, description: 'banks deleted successfully.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    return this.service.remove(id);
  }
}
