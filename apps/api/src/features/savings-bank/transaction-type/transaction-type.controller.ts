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
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { TransactionTypeService } from './transaction-type.service';

@Controller('transaction-type')
export class TransactionTypeController {
  constructor(
    private readonly transactionTypeService: TransactionTypeService,
  ) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:transaction-type')
  @ApiOperation({ summary: 'Create a new transaction type' })
  @ApiResponse({ status: 201, description: 'Transaction type successfully.' })
  @Post()
  async create(@Body() createTransactionTypeDto: CreateTransactionTypeDto) {
    const data = await this.transactionTypeService.create(
      createTransactionTypeDto,
    );
    return { message: 'Transaction type  created successfully', data };
  }

  @Get()
  @RequirePermissions('read:transaction-type')
  @ApiOperation({ summary: 'Get all Transaction type' })
  @ApiResponse({ status: 200, description: 'Return all Transaction type.' })
  @Get()
  async findAll() {
    const data = await this.transactionTypeService.findAll();
    return { message: 'Transaction type fetched successfully', data };
  }

  @Get('/paginated')
  @RequirePermissions('read:transaction-type')
  @ApiOperation({
    summary: 'Get all Transaction type with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated Transaction type .',
  })
  async findAllByPagination(@Query() paginationDto: PaginationDto) {
    const result =
      await this.transactionTypeService.findAllByPagination(paginationDto);
    return {
      message: 'Transaction type  fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/:id')
  @RequirePermissions('read:transaction-type')
  @ApiOperation({ summary: 'Get a Transaction type by ID' })
  @ApiResponse({ status: 200, description: 'Return the Transaction type.' })
  @ApiResponse({ status: 404, description: 'User not Transaction type.' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.transactionTypeService.findOne(+id);
    return { message: 'Transaction type fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:transaction-type')
  @ApiOperation({ summary: 'Update a Transaction type' })
  @ApiResponse({
    status: 200,
    description: 'Transaction type updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction type not found.' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTransactionTypeDto: UpdateTransactionTypeDto,
  ) {
    const data = await this.transactionTypeService.update(
      +id,
      updateTransactionTypeDto,
    );
    return { message: 'Transaction type updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:transaction-type')
  @ApiOperation({ summary: 'Delete a Transaction type' })
  @ApiResponse({
    status: 200,
    description: 'Transaction type deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction type not found.' })
  remove(@Param('id') id: string) {
    return this.transactionTypeService.remove(+id);
  }
}
