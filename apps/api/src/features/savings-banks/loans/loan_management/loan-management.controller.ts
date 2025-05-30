import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
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
import { CreateLoanDto } from './dto/create-loan.dto';
import { FilterLoanManagementDto } from './dto/filter-loan-management.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanManagementService } from './loan-management.service';

@Controller('loan')
export class LoanManagementController {
  constructor(private readonly loanManagementService: LoanManagementService) {}

  @Post()
  create(@Req() req: Request, @Body() createLoanDto: CreateLoanDto) {
    const userdId = req['user'].id;
    return this.loanManagementService.create(createLoanDto, userdId);
  }

  @Get()
  @RequirePermissions('read:loan-management')
  @ApiOperation({ summary: 'Get all Loan ordinary or filter by Loan ' })
  @ApiResponse({ status: 200, description: 'Return all Loan.' })
  findAll(@Query() paginationDto: FilterLoanManagementDto) {
    return this.loanManagementService.findAll(paginationDto);
  }

  @Get('count')
  @RequirePermissions('read:loan-management-count')
  @ApiOperation({ summary: 'Get all Loan count' })
  @ApiResponse({ status: 200, description: 'Return all Loan count.' })
  findCountAllLoans() {
    return this.loanManagementService.findCountAllLoans();
  }

  @Get('request/:cedula')
  @RequirePermissions('read:loan-management-requests')
  @ApiOperation({ summary: 'Get one Loan associate' })
  @ApiResponse({ status: 200, description: 'Return on Loan associate.' })
  @ApiResponse({ status: 404, description: 'Loan Associate  not found.' })
  findOneRequest(@Param('cedula') cedula: string) {
    return this.loanManagementService.findOneRequest(cedula);
  }

  @Get('request/byEdit/:id')
  @RequirePermissions('read:loan-management-edit')
  @ApiOperation({ summary: 'Get one Loan by edit' })
  @ApiResponse({ status: 200, description: 'Return on Loan edit.' })
  @ApiResponse({ status: 404, description: 'Loan edit  not found.' })
  findOneEdit(@Param('id') id: string) {
    return this.loanManagementService.findRequestByEdit(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loanManagementService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions('update:loan-management')
  @ApiOperation({ summary: 'Update an Loan ' })
  @ApiResponse({
    status: 200,
    description: 'Loan  updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Loan  not found.' })
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateLoanDto: UpdateLoanDto,
  ) {
    const userdId = req['user'].id;
    return this.loanManagementService.update(+id, updateLoanDto, userdId);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:loan-management')
  @ApiOperation({ summary: 'Delete an Loan ' })
  @ApiResponse({
    status: 200,
    description: 'Loan  deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Loan  not found.' })
  remove(@Param('id') id: string) {
    return this.loanManagementService.remove(+id);
  }
}
