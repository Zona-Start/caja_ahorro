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
import { CreateSalesProductCategoryDto } from './dto/create-sales-product-category.dto';
import { UpdateSalesProductCategoryDto } from './dto/update-sales-product-category.dto';
import { SalesProductCategoriesService } from './sales-product-categories.service';

@Controller('inventory/sales/sales-product-categories')
export class SalesProductCategoriesController {
  constructor(
    private readonly salesProductCategoriesService: SalesProductCategoriesService,
  ) {}

  @Post()
  @RequirePermissions('create:sales-product-categories')
  @ApiOperation({ summary: 'Create a new Product Categories' })
  @ApiResponse({
    status: 200,
    description: 'Product Categories created successfully.',
  })
  create(
    @Req() req: Request,
    @Body() createSalesProductCategoryDto: CreateSalesProductCategoryDto,
  ) {
    const userId = req['user'].id;
    return this.salesProductCategoriesService.create(
      userId,
      createSalesProductCategoryDto,
    );
  }

  @Get('/paginated')
  @RequirePermissions('read:sales-product-categories')
  @ApiOperation({ summary: 'Get all Product Categories' })
  @ApiResponse({ status: 200, description: 'Return all Product Categories.' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.salesProductCategoriesService.findAll(paginationDto);
  }

  @Get('/all')
  @RequirePermissions('read:sales-product-categories')
  @ApiOperation({ summary: 'Get all Product Categories' })
  @ApiResponse({ status: 200, description: 'Return all Product Categories.' })
  findAllCategories() {
    return this.salesProductCategoriesService.findAllCategories();
  }

  @Get(':id')
  @RequirePermissions('read:sales-product-categories')
  @ApiOperation({ summary: 'Get one Product Categories' })
  @ApiResponse({ status: 200, description: 'Return one Product Categories.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesProductCategoriesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('update:sales-product-categories')
  @ApiOperation({ summary: 'Update one Product Categories' })
  @ApiResponse({ status: 200, description: 'Update Product Categories.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSalesProductCategoryDto: UpdateSalesProductCategoryDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    return this.salesProductCategoriesService.update(
      id,
      updateSalesProductCategoryDto,
      userId,
    );
  }

  @Delete(':id')
  @RequirePermissions('delete:sales-product-categories')
  @ApiOperation({ summary: 'Delete one Product Categories' })
  @ApiResponse({ status: 200, description: 'Delete Product Categories.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesProductCategoriesService.remove(id);
  }
}
