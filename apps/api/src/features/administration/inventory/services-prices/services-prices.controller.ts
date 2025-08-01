import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateServicePriceDto } from './dto/create-services-price.dto';
import { FilterServicePriceDto } from './dto/filter-services-price.dto';
import { ServicePricesService } from './services-prices.service';

@ApiTags('inventory/service-prices')
@Controller('inventory/service-prices')
export class ServicePricesController {
  constructor(private readonly services: ServicePricesService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:service-price')
  @ApiOperation({ summary: 'Create a new service price' })
  @ApiResponse({
    status: 201,
    description: 'Service price created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateServicePriceDto) {
    const userId = req['user'].id;
    const data = await this.services.create(userId, dto);
    return { message: 'Service price created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:service-prices')
  @ApiOperation({ summary: 'Get all service prices' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all service prices.' })
  async findAll(@Query() paginationDto: FilterServicePriceDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Service prices fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:service-price')
  @ApiOperation({ summary: 'Get a service price by ID' })
  @ApiResponse({ status: 200, description: 'Return the service price.' })
  @ApiResponse({ status: 404, description: 'Service price not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Service price fetched successfully', data };
  }
}
