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
import { CreateTypeOperationsDto } from './dto/create-type-operations.dto';
import { FilterTypeOperationsDto } from './dto/filter-type-operations.dto';
import { UpdateTypeOperationsDto } from './dto/update-type-operations.dto';
import { TypeOperationsService } from './type-operations.service';

@Controller('core/type-operations')
export class TypeOperationsController {
  constructor(private readonly typeOperationsService: TypeOperationsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:transaction-type')
  @ApiOperation({ summary: 'Create a new transaction type' })
  @ApiResponse({ status: 201, description: 'Transaction type successfully.' })
  @Post()
  async create(
    @Req() req: Request,
    @Body() createTypeOperationsDto: CreateTypeOperationsDto,
  ) {
    const userId = req['user'].id;
    const data = await this.typeOperationsService.create(
      userId,
      createTypeOperationsDto,
    );
    return { message: 'Transaction type  created successfully', data };
  }

  @Get()
  @RequirePermissions('read:transaction-type')
  @ApiOperation({ summary: 'Get all Transaction type' })
  @ApiResponse({ status: 200, description: 'Return all Transaction type.' })
  async findAll() {
    const data = await this.typeOperationsService.findAll();
    return { message: 'Transaction type fetched successfully', data };
  }

  @Get('/paginated')
  @RequirePermissions('read:transaction-type')
  @ApiOperation({
    summary: 'Get all Transaction type with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated Transaction type .',
  })
  async findAllByPagination(
    @Query() filterTypeOperationsDto: FilterTypeOperationsDto,
  ) {
    const result = await this.typeOperationsService.findAllByPagination(
      filterTypeOperationsDto,
    );
    return {
      message: 'Transaction type  fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/:id')
  @RequirePermissions('read:transaction-type')
  @ApiOperation({ summary: 'Get a Transaction type by ID' })
  @ApiResponse({ status: 200, description: 'Return the Transaction type.' })
  @ApiResponse({ status: 404, description: 'User not Transaction type.' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.typeOperationsService.findOne(+id);
    return { message: 'Transaction type fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:transaction-type')
  @ApiOperation({ summary: 'Update a Transaction type' })
  @ApiResponse({
    status: 200,
    description: 'Transaction type updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction type not found.' })
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTypeOperationsDto: UpdateTypeOperationsDto,
  ) {
    const userId = req['user'].id;
    const data = await this.typeOperationsService.update(
      +id,
      userId,
      updateTypeOperationsDto,
    );
    return { message: 'Transaction type updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:transaction-type')
  @ApiOperation({ summary: 'Delete a Transaction type' })
  @ApiResponse({
    status: 200,
    description: 'Transaction type deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction type not found.' })
  remove(@Param('id') id: string) {
    return this.typeOperationsService.remove(+id);
  }
}
