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
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BankService } from './bank.services';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';

@Controller('banks')
export class BankController {
  constructor(private readonly banksService: BankService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:banks')
  @ApiOperation({ summary: 'Create a new banks' })
  @ApiResponse({ status: 201, description: 'User banks successfully.' })
  create(@Body() createBankDto: CreateBankDto) {
    return this.banksService.create(createBankDto);
  }

  @Get()
  @Roles('admin', 'user')
  @RequirePermissions('read:banks')
  @ApiOperation({ summary: 'Get all banks' })
  @ApiResponse({ status: 200, description: 'Return all banks.' })
  findAll() {
    return this.banksService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'user')
  @RequirePermissions('read:banks')
  @ApiOperation({ summary: 'Get a banks by ID' })
  @ApiResponse({ status: 200, description: 'Return the banks.' })
  @ApiResponse({ status: 404, description: 'User not banks.' })
  findOne(@Param('id') id: string) {
    return this.banksService.findOne(id);
  }

  @Get(':code')
  @Roles('admin', 'user')
  @RequirePermissions('read:banks')
  @ApiOperation({ summary: 'Get a banks by ID' })
  @ApiResponse({ status: 200, description: 'Return the banks.' })
  @ApiResponse({ status: 404, description: 'User not banks.' })
  findByCode(@Param('code') code: string) {
    return this.banksService.findByCode(code);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:banks')
  @ApiOperation({ summary: 'Update a banks' })
  @ApiResponse({ status: 200, description: 'banks updated successfully.' })
  @ApiResponse({ status: 404, description: 'banks not found.' })
  update(@Param('id') id: string, @Body() updateBankDto: UpdateBankDto) {
    return this.banksService.update(id, updateBankDto);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:banks')
  @ApiOperation({ summary: 'Delete a banks' })
  @ApiResponse({ status: 200, description: 'banks deleted successfully.' })
  @ApiResponse({ status: 404, description: 'banks not found.' })
  remove(@Param('id') id: string) {
    return this.banksService.remove(id);
  }
}
