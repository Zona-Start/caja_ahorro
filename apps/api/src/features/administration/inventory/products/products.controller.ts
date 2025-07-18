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
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('inventory/sales/products')
@Controller('inventory/sales/products')
export class ProductsController {
  constructor(private readonly services: ProductsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:product')
  @ApiOperation({ summary: 'Create a new  product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateProductDto) {
    const userId = req['user'].id;
    const data = await this.services.create(userId, dto);
    return { message: 'Product created successfully', data };
  }

  @Get('/all')
  @RequirePermissions('read:products')
  @ApiOperation({ summary: 'Get all  products' })
  @ApiResponse({ status: 200, description: 'Return all  products.' })
  async findAllFixet() {
    const result = await this.services.findAllProduct();
    return {
      message: 'Products fetched successfully',
      data: result,
    };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:products')
  @ApiOperation({ summary: 'Get all  products' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all  products.' })
  async findAll(@Query() paginationDto: FilterProductDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Products fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:product')
  @ApiOperation({ summary: 'Get a  product by ID' })
  @ApiResponse({ status: 200, description: 'Return the  product.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Product fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:product')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const userId = req['user'].id;
    const data = await this.services.update(userId, +id, dto);
    return { message: 'Product updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:product')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async remove(@Param('id') id: string) {
    return await this.services.remove(+id);
  }
}
