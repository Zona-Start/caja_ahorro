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
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('administration/purchase-orders')
@Controller('administration/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly services: PurchaseOrdersService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:purchase-order')
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreatePurchaseOrderDto) {
    const userId = req['user'].id;
    const data = await this.services.create(userId, dto);
    return { message: 'Purchase order created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:purchase-orders')
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all purchase orders.' })
  async findAll(@Query() paginationDto: FilterPurchaseOrderDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Purchase orders fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:purchase-order')
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  @ApiResponse({ status: 200, description: 'Return the purchase order.' })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Purchase order fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:purchase-order')
  @ApiOperation({ summary: 'Update a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    const userId = req['user'].id;
    const data = await this.services.update(userId, +id, dto);
    return { message: 'Purchase order updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:purchase-order')
  @ApiOperation({ summary: 'Delete a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  async remove(@Param('id') id: string) {
    return await this.services.remove(+id);
  }
}
