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
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FilterSupplierDto } from './dto/filter-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';
import { SuppliersService } from './suppliers.service';

@ApiTags('administration/suppliers')
@Controller('administration/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:supplier')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully.',
    type: Supplier,
  })
  async create(
    @Req() req: Request,
    @Body() createSupplierDto: CreateSupplierDto,
  ) {
    const userId = req['user'].id;
    return await this.suppliersService.create(userId, createSupplierDto);
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:suppliers')
  @ApiOperation({ summary: 'Get all suppliers with pagination and filters' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or taxId',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by supplier name',
  })
  @ApiQuery({
    name: 'taxId',
    required: false,
    type: String,
    description: 'Filter by supplier tax ID',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by supplier category',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by supplier status',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated suppliers.',
    type: [Supplier],
  })
  async findAll(@Query() filterSupplierDto: FilterSupplierDto) {
    return await this.suppliersService.findAll(filterSupplierDto);
  }

  @Get('/all')
  @Roles('admin')
  @RequirePermissions('read:supplier')
  @ApiOperation({ summary: 'Get all supplier' })
  @ApiResponse({
    status: 200,
    description: 'Return the supplier.',
    type: Supplier,
  })
  @ApiResponse({ status: 404, description: 'Suppliers not found.' })
  async findAllSuppliers(@Param('id') id: string) {
    const data = await this.suppliersService.findAllSuppliers();
    return { message: 'Supplier fetched successfully', data };
  }

  @Get('/count')
  @Roles('admin')
  @RequirePermissions('read:supplier')
  @ApiOperation({ summary: 'Get count supplier' })
  @ApiResponse({
    status: 200,
    description: 'Return the supplier.',
    type: Supplier,
  })
  @ApiResponse({ status: 404, description: 'Suppliers not found.' })
  async findCountSuppliers(@Param('id') id: string) {
    return await this.suppliersService.getSupplierStatus();
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:supplier')
  @ApiOperation({ summary: 'Get a supplier by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the supplier.',
    type: Supplier,
  })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  async findOne(@Param('id') id: string) {
    return await this.suppliersService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:supplier')
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiResponse({
    status: 200,
    description: 'Supplier updated successfully.',
    type: Supplier,
  })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    const userId = req['user'].id;
    return await this.suppliersService.update(userId, +id, updateSupplierDto);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:supplier')
  @ApiOperation({ summary: 'Delete a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  async remove(@Param('id') id: string) {
    return await this.suppliersService.remove(+id);
  }
}
