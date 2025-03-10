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
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTransactionCountableDto } from './dto/create-transaction-countable.dto';
import { UpdateTransactionCountableDto } from './dto/update-transaction-countable.dto';
import { TransactionsCountableService } from './transactions-countable.service';

@ApiTags('transactions-countable')
@Controller('transactions-countable')
export class TransactionsCountableController {
  constructor(
    private readonly transactionsCountableService: TransactionsCountableService,
  ) {}

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:transaction-countable')
  @ApiOperation({ summary: 'Create a new accounting transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  async create(
    @Body() createTransactionCountableDto: CreateTransactionCountableDto,
  ) {
    const data = await this.transactionsCountableService.create(
      createTransactionCountableDto,
    );
    return { message: 'Transaction created successfully', data };
  }

  @Get()
  @Roles('ADMIN')
  @RequirePermissions('read:transactions-countable')
  @ApiOperation({
    summary: 'Get all accounting transactions or filter by savings bank ID',
  })
  @ApiQuery({ name: 'savingsBankId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all transactions.' })
  async findAll(@Query('savingsBankId') savingsBankId?: string) {
    let data;
    if (savingsBankId) {
      data =
        await this.transactionsCountableService.findAllBySavingsBank(
          +savingsBankId,
        );
    } else {
      data = await this.transactionsCountableService.findAll();
    }
    return { message: 'Transactions fetched successfully', data };
  }

  @Get(':id')
  @Roles('ADMIN')
  @RequirePermissions('read:transaction-countable')
  @ApiOperation({ summary: 'Get an accounting transaction by ID' })
  @ApiResponse({ status: 200, description: 'Return the transaction.' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.transactionsCountableService.findOne(+id);
    return { message: 'Transaction fetched successfully', data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:transaction-countable')
  @ApiOperation({ summary: 'Update an accounting transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateTransactionCountableDto: UpdateTransactionCountableDto,
  ) {
    const data = await this.transactionsCountableService.update(
      +id,
      updateTransactionCountableDto,
    );
    return { message: 'Transaction updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @RequirePermissions('delete:transaction-countable')
  @ApiOperation({ summary: 'Delete an accounting transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async remove(@Param('id') id: string) {
    return await this.transactionsCountableService.remove(+id);
  }
}
