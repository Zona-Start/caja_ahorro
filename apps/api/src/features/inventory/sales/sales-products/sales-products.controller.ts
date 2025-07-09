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
import { CreateSalesProductDto } from './dto/create-sales-product.dto';
import { FilterSalesProductDto } from './dto/filter-sales-product.dto';
import { UpdateSalesProductDto } from './dto/update-sales-product.dto';
import { SalesProductsService } from './sales-products.service';

@ApiTags('inventory/sales/sales-products')
@Controller('inventory/sales/sales-products')
export class SalesProductsController {
  constructor(private readonly salesProductsService: SalesProductsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:sales-product')
  @ApiOperation({ summary: 'Create a new sales product' })
  @ApiResponse({
    status: 201,
    description: 'Sales product created successfully.',
  })
  async create(
    @Req() req: Request,
    @Body() createSalesProductDto: CreateSalesProductDto,
  ) {
    const userId = req['user'].id;
    const data = await this.salesProductsService.create(
      userId,
      createSalesProductDto,
    );
    return { message: 'Sales product created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:sales-products')
  @ApiOperation({ summary: 'Get all sales products' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all sales products.' })
  async findAll(@Query() paginationDto: FilterSalesProductDto) {
    const result = await this.salesProductsService.findAll(paginationDto);
    return {
      message: 'Sales products fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:sales-product')
  @ApiOperation({ summary: 'Get a sales product by ID' })
  @ApiResponse({ status: 200, description: 'Return the sales product.' })
  @ApiResponse({ status: 404, description: 'Sales product not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.salesProductsService.findOne(+id);
    return { message: 'Sales product fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:sales-product')
  @ApiOperation({ summary: 'Update a sales product' })
  @ApiResponse({
    status: 200,
    description: 'Sales product updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Sales product not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateSalesProductDto: UpdateSalesProductDto,
  ) {
    const userId = req['user'].id;
    const data = await this.salesProductsService.update(
      userId,
      +id,
      updateSalesProductDto,
    );
    return { message: 'Sales product updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:sales-product')
  @ApiOperation({ summary: 'Delete a sales product' })
  @ApiResponse({
    status: 200,
    description: 'Sales product deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Sales product not found.' })
  async remove(@Param('id') id: string) {
    return await this.salesProductsService.remove(+id);
  }
}
