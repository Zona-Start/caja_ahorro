import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateLoanTypeDto } from './dto/create-loan-type.dto';
import { UpdateLoanTypeDto } from './dto/update-loan-type.dto';
import { LoanTypesService } from './loan-types.service';

@Controller('loan-types')
export class LoanTypesController {
  constructor(private readonly loanTypesService: LoanTypesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:loan-types')
  @ApiOperation({ summary: 'Create a new loan type' })
  @ApiResponse({ status: 201, description: 'Loan Type created successfully.' })
  async create(
    @Req() req: Request,
    @Body() createLoanTypeDto: CreateLoanTypeDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.loanTypesService.create(createLoanTypeDto, userdId);
    return { message: 'Loan Type created successfully', data };
  }

  @Get()
  @RequirePermissions('read:loan-types')
  @ApiOperation({ summary: 'Get all Loan Type or filter' })
  @ApiResponse({ status: 200, description: 'Return all Loan Types.' })
  async findAll(@Query('search') search?: string) {
    const result = await this.loanTypesService.findAll(search);
    return {
      message: 'Loan Types fetched successfully',
      data: result,
    };
  }

  @Get(':id')
  @RequirePermissions('read:loan-types')
  @ApiOperation({ summary: 'Get an Loan Type  by ID' })
  @ApiResponse({ status: 200, description: 'Return the Loan Type .' })
  @ApiResponse({ status: 404, description: 'Loan Type  not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.loanTypesService.findOne(+id);
    return { message: 'Loan Type fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:loan-types')
  @ApiOperation({ summary: 'Update an Loan Type' })
  @ApiResponse({ status: 200, description: 'Loan Type updated successfully.' })
  @ApiResponse({ status: 404, description: 'Loan Type not found.' })
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoanTypeDto: UpdateLoanTypeDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.loanTypesService.update(
      id,
      updateLoanTypeDto,
      userdId,
    );
    return { message: 'Loan Type updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:loan-types')
  @ApiOperation({ summary: 'Delete an Loan Type' })
  @ApiResponse({ status: 200, description: 'Loan Type deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Loan Type not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.loanTypesService.remove(id);
  }
}
