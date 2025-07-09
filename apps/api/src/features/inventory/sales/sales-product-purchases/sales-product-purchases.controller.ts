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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSalesProductPurchaseDto } from './dto/create-sales-product-purchase.dto';
import { FilterSalesProductPurchaseDto } from './dto/filter-sales-product-purchase.dto';
import { UpdateSalesProductPurchaseDto } from './dto/update-sales-product-purchase.dto';
import { SalesProductPurchasesService } from './sales-product-purchases.service';

@ApiTags('inventory/sales/product-purchases')
@Controller('inventory/sales/product-purchases')
export class SalesProductPurchasesController {
  constructor(private readonly salesProductPurchasesService: SalesProductPurchasesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:sales-product-purchase')
  @ApiOperation({ summary: 'Create a new sales product purchase' })
  @ApiResponse({ status: 201, description: 'Sales product purchase created successfully.' })
  async create(
    @Req() req: Request,
    @Body() createSalesProductPurchaseDto: CreateSalesProductPurchaseDto,
  ) {
    const userId = req['user'].id;
    const data = await this.salesProductPurchasesService.create(
      userId,
      createSalesProductPurchaseDto,
    );
    return { message: 'Sales product purchase created successfully', data };
  }

  @Get()
  @Roles('admin')
  @RequirePermissions('read:sales-product-purchases')
  @ApiOperation({ summary: 'Get all sales product purchases with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Return all sales product purchases.' })
  async findAll(@Query() paginationDto: FilterSalesProductPurchaseDto) {
    const result = await this.salesProductPurchasesService.findAll(paginationDto);
    return {
      message: 'Sales product purchases fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:sales-product-purchase')
  @ApiOperation({ summary: 'Get a sales product purchase by ID' })
  @ApiResponse({ status: 200, description: 'Return the sales product purchase.' })
  @ApiResponse({ status: 404, description: 'Sales product purchase not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.salesProductPurchasesService.findOne(+id);
    return { message: 'Sales product purchase fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:sales-product-purchase')
  @ApiOperation({ summary: 'Update a sales product purchase' })
  @ApiResponse({ status: 200, description: 'Sales product purchase updated successfully.' })
  @ApiResponse({ status: 404, description: 'Sales product purchase not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateSalesProductPurchaseDto: UpdateSalesProductPurchaseDto,
  ) {
    const userId = req['user'].id;
    const data = await this.salesProductPurchasesService.update(
      userId,
      +id,
      updateSalesProductPurchaseDto,
    );
    return { message: 'Sales product purchase updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:sales-product-purchase')
  @ApiOperation({ summary: 'Delete a sales product purchase' })
  @ApiResponse({ status: 200, description: 'Sales product purchase deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Sales product purchase not found.' })
  async remove(@Param('id') id: string) {
    return await this.salesProductPurchasesService.remove(+id);
  }
}
