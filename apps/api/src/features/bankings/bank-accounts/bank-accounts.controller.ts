import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
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
import { BankAccountsService } from './bank-accounts.service';
import { FilterBankAccountDto } from './dto/filter-bank-account.dto';

@Controller('bakings/bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:bank-accounts')
  @ApiOperation({ summary: 'Create a new bank account' })
  @ApiResponse({
    status: 201,
    description: 'Bank account created successfully.',
  })
  async create(@Req() req: Request, @Body() createBankAccountDto: any) {
    const userId = req['user'].id;
    const data = await this.bankAccountsService.create(
      userId,
      createBankAccountDto,
    );
    return { message: 'Bank Account created successfully', data };
  }

  @Get()
  @RequirePermissions('read:bank-accounts')
  @ApiOperation({ summary: 'Get all bank accounts' })
  @ApiResponse({ status: 200, description: 'Return all bank accounts.' })
  async findAll() {
    const data = await this.bankAccountsService.findAll();
    return { message: 'Bank Accounts fetched successfully', data };
  }

  @Get('/paginated')
  @RequirePermissions('read:bank-accounts')
  @ApiOperation({
    summary: 'Get all bank accounts',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated all bank accounts.',
  })
  async findAllByPagination(
    @Query() filterBankAccountDto: FilterBankAccountDto,
  ) {
    const result =
      await this.bankAccountsService.findAllByPagination(filterBankAccountDto);
    return {
      message: 'Bank Accounts fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @RequirePermissions('read:bank-accounts')
  @ApiOperation({ summary: 'Get a bank account by ID' })
  @ApiResponse({ status: 200, description: 'Return the bank account.' })
  @ApiResponse({ status: 404, description: 'Bank account not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.bankAccountsService.findOne(+id);
    return { message: 'Bank Account fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:bank-accounts')
  @ApiOperation({ summary: 'Update a bank account' })
  @ApiResponse({
    status: 200,
    description: 'Bank account updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Bank account not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateBankAccountDto: any,
  ) {
    const userId = req['user'].id;
    const data = await this.bankAccountsService.update(
      +id,
      userId,
      updateBankAccountDto,
    );
    return { message: 'Bank Account updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:bank-accounts')
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiResponse({
    status: 200,
    description: 'Bank account deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Bank account not found.' })
  async remove(@Param('id') id: string) {
    const result = await this.bankAccountsService.remove(+id);
    return result;
  }
}
