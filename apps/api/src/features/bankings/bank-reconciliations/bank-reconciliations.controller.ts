import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Request,
} from '@nestjs/common';
import { BankReconciliationsService } from './bank-reconciliations.service';
import { CreateBankReconciliationDto } from './dto/create-bank-reconciliation.dto';
import { AddReconciliationDetailDto } from './dto/add-reconciliation-detail.dto';
import { FilterBankReconciliationDto } from './dto/filter-bank-reconciliation.dto';

@Controller('bankings/bank-reconciliations')
export class BankReconciliationsController {
  constructor(
    private readonly bankReconciliationsService: BankReconciliationsService,
  ) {}

  @Post()
  create(@Body() createDto: CreateBankReconciliationDto, @Request() req: any) {
    const userId = req.user?.id || 1; // Asumiendo un MW de Auth
    return this.bankReconciliationsService.create(createDto, userId);
  }

  @Post(':id/details')
  addDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() detailDto: AddReconciliationDetailDto,
  ) {
    return this.bankReconciliationsService.addDetail(id, detailDto);
  }

  @Post(':id/process')
  processAndComplete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.bankReconciliationsService.processAndComplete(id, userId);
  }

  @Get()
  findAll(@Query('bankAccountId') bankAccountId?: string) {
    return this.bankReconciliationsService.findAll(
      bankAccountId ? +bankAccountId : undefined,
    );
  }

  @Get('/paginated')
  async findAllByPagination(
    @Query() filterDto: FilterBankReconciliationDto,
  ) {
    const result =
      await this.bankReconciliationsService.findAllByPagination(filterDto);
    return {
      message: 'Bank Reconciliations fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bankReconciliationsService.findOne(id);
  }
}
