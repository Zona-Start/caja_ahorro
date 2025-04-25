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
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BankDirectoryService } from './bank-directory.services';
import { CreateBankDirectoryDto } from './dto/create-bank-directory.dto';
import { UpdateBankDirectoryDto } from './dto/update-bank-directory.dto';

@Controller('banks-directory')
export class BankDirectoryController {
  constructor(private readonly bankDirectoryService: BankDirectoryService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:bank-directory')
  @ApiOperation({ summary: 'Create a new bank directory' })
  @ApiResponse({ status: 201, description: 'User banks successfully.' })
  async create(
    @Req() req: Request,
    @Body() createBankDirectoryDto: CreateBankDirectoryDto,
  ) {
    const userId = req['user'].id;
    const data = await this.bankDirectoryService.create(
      userId,
      createBankDirectoryDto,
    );
    return { message: 'Banks Directory created successfully', data };
  }

  @Get()
  @RequirePermissions('read:banks-directory')
  @ApiOperation({ summary: 'Get all banks directory' })
  @ApiResponse({ status: 200, description: 'Return all banks.' })
  async findAll() {
    const data = await this.bankDirectoryService.findAll();
    return { message: 'Banks directory fetched successfully', data };
  }

  @Get('/paginated')
  @RequirePermissions('read:banks-directory')
  @ApiOperation({
    summary: 'Get all banks directory with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Return paginated banks .' })
  async findAllByPagination(@Query() paginationDto: PaginationDto) {
    const result =
      await this.bankDirectoryService.findAllByPagination(paginationDto);
    return {
      message: 'banks directory fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/:id')
  @RequirePermissions('read:banks-directory')
  @ApiOperation({ summary: 'Get a banks by ID' })
  @ApiResponse({ status: 200, description: 'Return the banks.' })
  @ApiResponse({ status: 404, description: 'User not banks.' })
  async findOne(@Param('id') id: string) {
    const data = await this.bankDirectoryService.findOne(id);
    return { message: 'Bank directory fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:banks')
  @ApiOperation({ summary: 'Update a banks' })
  @ApiResponse({ status: 200, description: 'banks updated successfully.' })
  @ApiResponse({ status: 404, description: 'banks not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateBankDirectoryDto: UpdateBankDirectoryDto,
  ) {
    const userId = req['user'].id;
    const data = await this.bankDirectoryService.update(
      userId,
      id,
      updateBankDirectoryDto,
    );
    return { message: 'Bank updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:banks')
  @ApiOperation({ summary: 'Delete a banks' })
  @ApiResponse({ status: 200, description: 'banks deleted successfully.' })
  @ApiResponse({ status: 404, description: 'banks not found.' })
  remove(@Param('id') id: string) {
    return this.bankDirectoryService.remove(id);
  }
}
