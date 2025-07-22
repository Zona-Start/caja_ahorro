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
import { CreateProductServiceSupplierDto } from './dto/create-product-service-supplier.dto';
import { FilterProductServiceSupplierDto } from './dto/filter-product-service-supplier.dto';
import { UpdateProductServiceSupplierDto } from './dto/update-product-service-supplier.dto';
import { ProductServiceSuppliersService } from './product-service-suppliers.service';

@ApiTags('inventory/product-service-suppliers')
@Controller('inventory/product-service-suppliers')
export class ProductServiceSuppliersController {
  constructor(private readonly services: ProductServiceSuppliersService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:product-service-supplier')
  @ApiOperation({ summary: 'Create a new product service supplier' })
  @ApiResponse({
    status: 201,
    description: 'Product service supplier created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateProductServiceSupplierDto) {
    const userId = req['user'].id;
    const data = await this.services.create(userId, dto);
    return { message: 'Product service supplier created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:product-service-suppliers')
  @ApiOperation({ summary: 'Get all product service suppliers' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all product service suppliers.' })
  async findAll(@Query() paginationDto: FilterProductServiceSupplierDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Product service suppliers fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:product-service-supplier')
  @ApiOperation({ summary: 'Get a product service supplier by ID' })
  @ApiResponse({ status: 200, description: 'Return the product service supplier.' })
  @ApiResponse({ status: 404, description: 'Product service supplier not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Product service supplier fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:product-service-supplier')
  @ApiOperation({ summary: 'Update a product service supplier' })
  @ApiResponse({
    status: 200,
    description: 'Product service supplier updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product service supplier not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateProductServiceSupplierDto,
  ) {
    const userId = req['user'].id;
    const data = await this.services.update(userId, +id, dto);
    return { message: 'Product service supplier updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:product-service-supplier')
  @ApiOperation({ summary: 'Delete a product service supplier' })
  @ApiResponse({
    status: 200,
    description: 'Product service supplier deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product service supplier not found.' })
  async remove(@Param('id') id: string) {
    return await this.services.remove(+id);
  }
}
