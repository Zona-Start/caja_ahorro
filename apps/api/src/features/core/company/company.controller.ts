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
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('company')
@Controller('core/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all company' })
  @ApiResponse({ status: 200, description: 'Return all company.' })
  async findAll() {
    const data = await this.companyService.findAll();
    return { message: 'Company fetched successfully', data };
  }

  @Patch(':id')
  @Roles('superadmin')
  @RequirePermissions('update:company')
  @ApiOperation({ summary: 'Update a Company' })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const data = await this.companyService.update(+id, updateCompanyDto);
    return { message: 'Company updated successfully', data };
  }

  //Banks Accounts

  @Get(':companyId/bank-accounts')
  @Roles('admin')
  @RequirePermissions('read:banks-accounts-company')
  @ApiOperation({ summary: 'Get all banks account company' })
  @ApiResponse({
    status: 200,
    description: 'Return all banks account company.',
  })
  async findAllBankAccountsByCompanyId(@Param('companyId') companyId: string) {
    const data =
      await this.companyService.findAllBankAccountsByCompanyId(+companyId);
    return { message: 'Banks Accounts Company fetched successfully', data };
  }

  @Post('/create/bank-accounts')
  @Roles('admin')
  @RequirePermissions('create:banks-accounts-company')
  @ApiOperation({ summary: 'Create banks account company' })
  @ApiResponse({
    status: 201,
    description: 'Banks account company successfully.',
  })
  async create(
    @Req() req: Request,
    @Body() createBankAccountDto: CreateBankAccountDto,
  ) {
    const userId = req['user'].id;
    const data = await this.companyService.createBankAccount(
      userId,
      createBankAccountDto,
    );
    return { message: 'Banks account for company created successfully', data };
  }

  @Patch(':companyId/bank-accounts')
  @Roles('admin')
  @RequirePermissions('update:banks-accounts-company')
  @ApiOperation({ summary: 'Update a Banks account for company' })
  @ApiResponse({
    status: 200,
    description: 'Banks account for company updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  async updateBankAccount(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ) {
    const userId = req['user'].id;
    const data = await this.companyService.updateBankAccount(
      userId,
      +id,
      updateBankAccountDto,
    );
    return { message: 'Banks account for company updated successfully', data };
  }

  @Delete(':id/bank-accounts')
  @Roles('admin')
  @RequirePermissions('delete:banks-accounts-company')
  @ApiOperation({ summary: 'Delete a Banks account for company' })
  @ApiResponse({
    status: 200,
    description: 'Banks account for company deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Banks account for companynot found.',
  })
  removeBankAccount(@Param('id') id: string) {
    return this.companyService.removeBankAccount(+id);
  }
}
