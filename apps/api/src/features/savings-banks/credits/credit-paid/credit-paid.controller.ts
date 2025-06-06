import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreditPaidService } from './credit-paid.service';
import { CreateCreditPaidDto } from './dto/create-credit.dto';
import { FilterCreditPaidDto } from './dto/filter-credit-paid.dto';

@Controller('credit-paid')
export class CrediPaidController {
  constructor(private readonly creditPaidService: CreditPaidService) {}

  @Post()
  @RequirePermissions('read:credit-paid')
  create(@Req() req: Request, @Body() dto: CreateCreditPaidDto) {
    const userdId = req['user'].id;
    return this.creditPaidService.create(dto, userdId);
  }

  @Get()
  @RequirePermissions('read:credit-paid')
  @ApiOperation({ summary: 'Get all credit paid or filter by credit paid ' })
  @ApiResponse({ status: 200, description: 'Return all credit paid.' })
  findAll(@Query() paginationDto: FilterCreditPaidDto) {
    return this.creditPaidService.findAll(paginationDto);
  }

  // @Get('count')
  // @RequirePermissions('read:loan-management-count')
  // @ApiOperation({ summary: 'Get all Loan count' })
  // @ApiResponse({ status: 200, description: 'Return all Loan count.' })
  // findCountAllLoans() {
  //   return this.loanManagementService.findCountAllLoans();
  // }

  @Get('request/:cedula')
  @RequirePermissions('read:loan-paid-requests')
  @ApiOperation({ summary: 'Get one Loan associate' })
  @ApiResponse({ status: 200, description: 'Return on Loan associate.' })
  @ApiResponse({ status: 404, description: 'Loan Associate  not found.' })
  findOneRequest(@Param('cedula') cedula: string) {
    return this.creditPaidService.findOneRequest(cedula);
  }

  // @Get('request/byEdit/:id')
  // @RequirePermissions('read:loan-management-edit')
  // @ApiOperation({ summary: 'Get one Loan by edit' })
  // @ApiResponse({ status: 200, description: 'Return on Loan edit.' })
  // @ApiResponse({ status: 404, description: 'Loan edit  not found.' })
  // findOneEdit(@Param('id') id: string) {
  //   return this.loanManagementService.findRequestByEdit(+id);
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.loanManagementService.findOne(+id);
  // }

  // @Patch(':id')
  // @RequirePermissions('update:loan-management')
  // @ApiOperation({ summary: 'Update an Loan ' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Loan  updated successfully.',
  // })
  // @ApiResponse({ status: 404, description: 'Loan  not found.' })
  // update(
  //   @Req() req: Request,
  //   @Param('id') id: string,
  //   @Body() updateLoanDto: UpdateLoanDto,
  // ) {
  //   const userdId = req['user'].id;
  //   return this.loanManagementService.update(+id, updateLoanDto, userdId);
  // }

  // @Delete(':id')
  // @Roles('admin')
  // @RequirePermissions('delete:loan-management')
  // @ApiOperation({ summary: 'Delete an Loan ' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Loan  deleted successfully.',
  // })
  // @ApiResponse({ status: 404, description: 'Loan  not found.' })
  // remove(@Param('id') id: string) {
  //   return this.loanManagementService.remove(+id);
  // }
}
