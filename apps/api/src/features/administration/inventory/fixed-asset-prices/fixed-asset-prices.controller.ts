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
import { CreateFixedAssetPriceDto } from './dto/create-fixed-asset-price.dto';
import { FilterFixedAssetPriceDto } from './dto/filter-fixed-asset-price.dto';
import { UpdateFixedAssetPriceDto } from './dto/update-fixed-asset-price.dto';
import { FixedAssetPricesService } from './fixed-asset-prices.service';

@ApiTags('inventory/fixed-asset-prices')
@Controller('inventory/fixed-asset-prices')
export class FixedAssetPricesController {
  constructor(private readonly services: FixedAssetPricesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:fixed-asset-price')
  @ApiOperation({ summary: 'Create a new fixed asset price' })
  @ApiResponse({
    status: 201,
    description: 'Fixed asset price created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateFixedAssetPriceDto) {
    const userId = req['user'].id;
    const data = await this.services.create(userId, dto);
    return { message: 'Fixed asset price created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:fixed-asset-prices')
  @ApiOperation({ summary: 'Get all fixed asset prices' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all fixed asset prices.' })
  async findAll(@Query() paginationDto: FilterFixedAssetPriceDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Fixed asset prices fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:fixed-asset-price')
  @ApiOperation({ summary: 'Get a fixed asset price by ID' })
  @ApiResponse({ status: 200, description: 'Return the fixed asset price.' })
  @ApiResponse({ status: 404, description: 'Fixed asset price not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Fixed asset price fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:fixed-asset-price')
  @ApiOperation({ summary: 'Update a fixed asset price' })
  @ApiResponse({
    status: 200,
    description: 'Fixed asset price updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Fixed asset price not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateFixedAssetPriceDto,
  ) {
    const userId = req['user'].id;
    const data = await this.services.update(userId, +id, dto);
    return { message: 'Fixed asset price updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:fixed-asset-price')
  @ApiOperation({ summary: 'Delete a fixed asset price' })
  @ApiResponse({
    status: 200,
    description: 'Fixed asset price deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Fixed asset price not found.' })
  async remove(@Param('id') id: string) {
    return await this.services.remove(+id);
  }
}
