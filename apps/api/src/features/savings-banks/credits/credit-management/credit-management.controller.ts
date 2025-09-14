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
import { CreditManagementService } from './credit-management.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { FilterCreditManagementDto } from './dto/filter-credit-management.dto';

@Controller('credit')
export class CreditManagementController {
  constructor(
    private readonly creditManagementService: CreditManagementService,
  ) {}

  @Post('request')
  async request(@Req() req: Request, @Body() dto: CreateCreditDto) {
    const userdId = req['user'].id;
    return this.creditManagementService.request(dto, userdId);
  }

  @Get()
  @RequirePermissions('read:credit-management')
  @ApiOperation({ summary: 'Get all credit ordinary or filter by credit ' })
  @ApiResponse({ status: 200, description: 'Return all Loan.' })
  findAll(@Query() paginationDto: FilterCreditManagementDto) {
    return this.creditManagementService.findAll(paginationDto);
  }

  @Get('count')
  @RequirePermissions('read:credit-management-count')
  @ApiOperation({ summary: 'Get all credit count' })
  @ApiResponse({ status: 200, description: 'Return all credit count.' })
  findCountAllCredits() {
    return this.creditManagementService.findCountAllCredits();
  }

  @Get('request/:cedula')
  @RequirePermissions('read:credit-management-requests')
  @ApiOperation({ summary: 'Get one credit associate' })
  @ApiResponse({ status: 200, description: 'Return on credit associate.' })
  @ApiResponse({ status: 404, description: 'credit Associate  not found.' })
  findOneRequest(@Param('cedula') cedula: string) {
    return this.creditManagementService.findOneRequest(cedula);
  }

  @Get('request/byEdit/:id')
  @RequirePermissions('read:credit-management-edit')
  @ApiOperation({ summary: 'Get one credit by edit' })
  @ApiResponse({ status: 200, description: 'Return on credit edit.' })
  @ApiResponse({ status: 404, description: 'credit edit  not found.' })
  findOneEdit(@Param('id') id: string) {
    return this.creditManagementService.findRequestByEdit(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditManagementService.findOne(+id);
  }

  // @Patch(':id')
  // @RequirePermissions('update:credit-management')
  // @ApiOperation({ summary: 'Update an credit ' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'credit updated successfully.',
  // })
  // @ApiResponse({ status: 404, description: 'credit  not found.' })
  // update(
  //   @Req() req: Request,
  //   @Param('id') id: string,
  //   @Body() dto: UpdateCreditDto,
  // ) {
  //   const userdId = req['user'].id;
  //   return this.creditManagementService.update(+id, dto, userdId);
  // }

  @Patch('approve/:id')
  async approve(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userdId = req['user'].id;
    return await this.creditManagementService.approve(id, userdId);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:credit-management')
  @ApiOperation({ summary: 'Delete an credit ' })
  @ApiResponse({
    status: 200,
    description: 'credit deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'credit  not found.' })
  remove(@Param('id') id: string) {
    return this.creditManagementService.remove(+id);
  }
}
