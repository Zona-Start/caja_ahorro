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
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { FilterProductPriceDto } from './dto/filter-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { ProductPricesService } from './product-prices.service';

@ApiTags('inventory/product-prices')
@Controller('inventory/product-prices')
export class ProductPricesController {
  constructor(private readonly services: ProductPricesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:product-price')
  @ApiOperation({ summary: 'Create a new product price' })
  @ApiResponse({
    status: 201,
    description: 'Product price created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateProductPriceDto) {
    const userId = req['user'].id;
    const data = await this.services.create(userId, dto);
    return { message: 'Product price created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:product-prices')
  @ApiOperation({ summary: 'Get all product prices' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all product prices.' })
  async findAll(@Query() paginationDto: FilterProductPriceDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Product prices fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:product-price')
  @ApiOperation({ summary: 'Get a product price by ID' })
  @ApiResponse({ status: 200, description: 'Return the product price.' })
  @ApiResponse({ status: 404, description: 'Product price not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Product price fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:product-price')
  @ApiOperation({ summary: 'Update a product price' })
  @ApiResponse({
    status: 200,
    description: 'Product price updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product price not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateProductPriceDto,
  ) {
    const userId = req['user'].id;
    const data = await this.services.update(userId, +id, dto);
    return { message: 'Product price updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:product-price')
  @ApiOperation({ summary: 'Delete a product price' })
  @ApiResponse({
    status: 200,
    description: 'Product price deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product price not found.' })
  async remove(@Param('id') id: string) {
    return await this.services.remove(+id);
  }
}
