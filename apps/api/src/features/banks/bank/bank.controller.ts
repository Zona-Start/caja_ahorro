import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BankService } from './bank.services';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Controller('banks')
export class BankController {
  constructor(private readonly banksService: BankService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:banks')
  @ApiOperation({ summary: 'Create a new banks' })
  @ApiResponse({ status: 201, description: 'User banks successfully.' })
  async create(@Body() createBankDto: CreateBankDto) {
    const data = await this.banksService.create(createBankDto);
    return { message: 'Banks created successfully', data };
  }

  @Get()
  @RequirePermissions('read:banks')
  @ApiOperation({ summary: 'Get all banks' })
  @ApiResponse({ status: 200, description: 'Return all banks.' })
  async findAll() {
    const data = await this.banksService.findAll();
    return { message: 'Banks fetched successfully', data };
  }

  @Get('/paginated')
  @RequirePermissions('read:banks')
  @ApiOperation({
    summary: 'Get all banks with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Return paginated banks .' })
  async findAllByPagination(@Query() paginationDto: PaginationDto) {
    const result = await this.banksService.findAllByPagination(paginationDto);
    return {
      message: 'banks fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/:id')
  @RequirePermissions('read:banks')
  @ApiOperation({ summary: 'Get a banks by ID' })
  @ApiResponse({ status: 200, description: 'Return the banks.' })
  @ApiResponse({ status: 404, description: 'User not banks.' })
  async findOne(@Param('id') id: string) {
    const data = await this.banksService.findOne(id);
    return { message: 'Bank fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:banks')
  @ApiOperation({ summary: 'Update a banks' })
  @ApiResponse({ status: 200, description: 'banks updated successfully.' })
  @ApiResponse({ status: 404, description: 'banks not found.' })
  async update(@Param('id') id: string, @Body() updateBankDto: UpdateBankDto) {
    const data = await this.banksService.update(id, updateBankDto);
    return { message: 'Bank updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:banks')
  @ApiOperation({ summary: 'Delete a banks' })
  @ApiResponse({ status: 200, description: 'banks deleted successfully.' })
  @ApiResponse({ status: 404, description: 'banks not found.' })
  remove(@Param('id') id: string) {
    return this.banksService.remove(id);
  }
}
