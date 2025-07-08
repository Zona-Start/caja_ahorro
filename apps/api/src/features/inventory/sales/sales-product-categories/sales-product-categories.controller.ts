import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { SalesProductCategoriesService } from './sales-product-categories.service';
import { CreateSalesProductCategoryDto } from './dto/create-sales-product-category.dto';
import { UpdateSalesProductCategoryDto } from './dto/update-sales-product-category.dto';

@Controller('inventory/sales-product-categories')
export class SalesProductCategoriesController {
  constructor(
    private readonly salesProductCategoriesService: SalesProductCategoriesService,
  ) {}

  @Post()
  create(@Body() createSalesProductCategoryDto: CreateSalesProductCategoryDto) {
    return this.salesProductCategoriesService.create(
      createSalesProductCategoryDto,
    );
  }

  @Get()
  findAll() {
    return this.salesProductCategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesProductCategoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSalesProductCategoryDto: UpdateSalesProductCategoryDto,
  ) {
    return this.salesProductCategoriesService.update(
      id,
      updateSalesProductCategoryDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesProductCategoriesService.remove(id);
  }
}
