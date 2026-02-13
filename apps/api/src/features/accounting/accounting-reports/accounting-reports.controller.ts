import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountingReportsService } from './accounting-reports.service';
import { FilterBalanceSheetDto } from './dto/filter-balance-sheet.dto';
import { FilterGeneralLedgerDto } from './dto/filter-general-ledger.dto';
import { FilterIncomeStatementDto } from './dto/filter-income-statement.dto';
import { FilterJournalBookDto } from './dto/filter-journal-book.dto';
import { FilterTrialBalanceDto } from './dto/filter-trial-balance.dto';

@ApiTags('accounting-reports')
@Controller('accounting-reports')
export class AccountingReportsController {
  constructor(
    private readonly accountingReportsService: AccountingReportsService,
  ) {}

  @Get('journal-book')
  @Roles('superadmin', 'admin', 'accountant')
  @RequirePermissions('read:accounting-reports')
  @ApiOperation({
    summary: 'Get Journal Book (Libro Diario)',
    description:
      'Returns all accounting entries in chronological order with their details',
  })
  @ApiResponse({
    status: 200,
    description: 'Journal book retrieved successfully',
  })
  async getJournalBook(@Query() filterDto: FilterJournalBookDto) {
    return await this.accountingReportsService.getJournalBook(filterDto);
  }

  @Get('general-ledger')
  @Roles('superadmin', 'admin', 'accountant')
  @RequirePermissions('read:accounting-reports')
  @ApiOperation({
    summary: 'Get General Ledger (Libro Mayor)',
    description:
      'Returns movements for specific accounts with running balances',
  })
  @ApiResponse({
    status: 200,
    description: 'General ledger retrieved successfully',
  })
  async getGeneralLedger(@Query() filterDto: FilterGeneralLedgerDto) {
    return await this.accountingReportsService.getGeneralLedger(filterDto);
  }

  @Get('trial-balance')
  @Roles('superadmin', 'admin', 'accountant')
  @RequirePermissions('read:accounting-reports')
  @ApiOperation({
    summary: 'Get Trial Balance (Balance de Comprobación)',
    description:
      'Returns initial balances, period movements, and final balances for all accounts',
  })
  @ApiResponse({
    status: 200,
    description: 'Trial balance retrieved successfully',
  })
  async getTrialBalance(@Query() filterDto: FilterTrialBalanceDto) {
    return await this.accountingReportsService.getTrialBalance(filterDto);
  }

  @Get('balance-sheet')
  @Roles('superadmin', 'admin', 'accountant')
  @RequirePermissions('read:accounting-reports')
  @ApiOperation({
    summary: 'Get Balance Sheet (Balance General)',
    description: 'Returns assets, liabilities, and equity statement',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance sheet retrieved successfully',
  })
  async getBalanceSheet(@Query() filterDto: FilterBalanceSheetDto) {
    return await this.accountingReportsService.getBalanceSheet(filterDto);
  }

  @Get('income-statement')
  @Roles('superadmin', 'admin', 'accountant')
  @RequirePermissions('read:accounting-reports')
  @ApiOperation({
    summary: 'Get Income Statement (Estado de Resultados)',
    description: 'Returns revenue, expenses, and net income',
  })
  @ApiResponse({
    status: 200,
    description: 'Income statement retrieved successfully',
  })
  async getIncomeStatement(@Query() filterDto: FilterIncomeStatementDto) {
    return await this.accountingReportsService.getIncomeStatement(filterDto);
  }
}
