import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { TransactionTypesService } from './transaction-types.service';

@ApiTags('transaction-types')
@Controller('transaction-types')
export class TransactionTypesController {
  constructor(private readonly transactionTypesService: TransactionTypesService) {}

  @Get()
  @Roles('ADMIN')
  @RequirePermissions('read:transaction-types')
  @ApiOperation({ summary: 'Get all transaction types' })
  @ApiResponse({ status: 200, description: 'Return all transaction types.' })
  async findAll() {
    const data = await this.transactionTypesService.findAll();
    return { message: 'Transaction types fetched successfully', data };
  }

  @Get(':id')
  @Roles('ADMIN')
  @RequirePermissions('read:transaction-type')
  @ApiOperation({ summary: 'Get a transaction type by ID' })
  @ApiResponse({ status: 200, description: 'Return the transaction type.' })
  @ApiResponse({ status: 404, description: 'Transaction type not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.transactionTypesService.findOne(+id);
    return { message: 'Transaction type fetched successfully', data };
  }

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:transaction-type')
  @ApiOperation({ summary: 'Create a new transaction type' })
  @ApiResponse({ status: 201, description: 'Transaction type created successfully.' })
  async create(@Body() createTransactionTypeDto: CreateTransactionTypeDto) {
    const data = await this.transactionTypesService.create(createTransactionTypeDto);
    return { message: 'Transaction type created successfully', data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:transaction-type')
  @ApiOperation({ summary: 'Update a transaction type' })
  @ApiResponse({ status: 200, description: 'Transaction type updated successfully.' })
  @ApiResponse({ status: 404, description: 'Transaction type not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateTransactionTypeDto: UpdateTransactionTypeDto,
  ) {
    const data = await this.transactionTypesService.update(+id, updateTransactionTypeDto);
    return { message: 'Transaction type updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @RequirePermissions('delete:transaction-type')
  @ApiOperation({ summary: 'Delete a transaction type' })
  @ApiResponse({ status: 200, description: 'Transaction type deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Transaction type not found.' })
  async remove(@Param('id') id: string) {
    return await this.transactionTypesService.remove(+id);
  }
}