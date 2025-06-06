import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
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
import { CreditTypesService } from './credit-types.service';
import { CreateCreditTypeDto } from './dto/create-credit-type.dto';
import { UpdateCreditTypeDto } from './dto/update-credit-type.dto';

@Controller('savings-banks/credit-types')
export class CreditTypesController {
  constructor(private readonly creditTypesService: CreditTypesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:credit-types')
  @ApiOperation({ summary: 'Create a new credit type' })
  @ApiResponse({
    status: 201,
    description: 'credit Type created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateCreditTypeDto) {
    const userdId = req['user'].id;
    const data = await this.creditTypesService.create(dto, userdId);
    return { message: 'credit Type created successfully', data };
  }

  @Get()
  @RequirePermissions('read:credit-types')
  @ApiOperation({ summary: 'Get all credit Type or filter' })
  @ApiResponse({ status: 200, description: 'Return all credit Types.' })
  async findAll() {
    const result = await this.creditTypesService.findAll();
    return {
      message: 'credit Types fetched successfully',
      data: result,
    };
  }

  @Get('/paginated')
  @RequirePermissions('read:credit-types')
  @ApiOperation({
    summary: 'Get all credit Type with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated credit Type.',
  })
  async findAllByPagination(@Query() paginationDto: PaginationDto) {
    const result =
      await this.creditTypesService.findAllByPagination(paginationDto);
    return {
      message: 'credits Type fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @RequirePermissions('read:credit-types')
  @ApiOperation({ summary: 'Get an credit Type  by ID' })
  @ApiResponse({ status: 200, description: 'Return the credit Type .' })
  @ApiResponse({ status: 404, description: 'credit Type  not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.creditTypesService.findOne(+id);
    return { message: 'credit Type fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:credit-types')
  @ApiOperation({ summary: 'Update an credit Type' })
  @ApiResponse({
    status: 200,
    description: 'credit Type updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'credit Type not found.' })
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCreditTypeDto,
  ) {
    const userdId = req['user'].id;
    const data = await this.creditTypesService.update(id, dto, userdId);
    return { message: 'credit Type updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:credit-types')
  @ApiOperation({ summary: 'Delete an credit Type' })
  @ApiResponse({
    status: 200,
    description: 'credit Type deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'credit Type not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.creditTypesService.remove(id);
  }
}
