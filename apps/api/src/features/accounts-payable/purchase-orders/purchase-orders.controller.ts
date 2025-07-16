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
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('accounts-payable/purchase-orders')
@Controller('accounts-payable/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:purchase-order')
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created successfully.',
    type: PurchaseOrder,
  })
  async create(
    @Req() req: Request,
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
  ) {
    const userId = req['user'].id;
    const data = await this.purchaseOrdersService.create(
      userId,
      createPurchaseOrderDto,
    );
    return { message: 'Purchase order created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:purchase-orders')
  @ApiOperation({
    summary: 'Get all purchase orders with pagination and filters',
  })
  @ApiQuery({
    name: 'supplierId',
    required: false,
    type: Number,
    description: 'Filter by supplier ID',
  })
  @ApiQuery({
    name: 'invoiceNumber',
    required: false,
    type: String,
    description: 'Filter by invoice number',
  })
  @ApiQuery({
    name: 'purchaseDateStart',
    required: false,
    type: String,
    description: 'Filter by purchase date (start)',
  })
  @ApiQuery({
    name: 'purchaseDateEnd',
    required: false,
    type: String,
    description: 'Filter by purchase date (end)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated purchase orders.',
    type: [PurchaseOrder],
  })
  async findAll(@Query() filterPurchaseOrderDto: FilterPurchaseOrderDto) {
    const result = await this.purchaseOrdersService.findAll(
      filterPurchaseOrderDto,
    );
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
  @ApiResponse({
    status: 200,
    description: 'Return the purchase order.',
    type: PurchaseOrder,
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.purchaseOrdersService.findOne(+id);
    return { message: 'Purchase order fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:purchase-order')
  @ApiOperation({ summary: 'Update a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order updated successfully.',
    type: PurchaseOrder,
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ) {
    const userId = req['user'].id;
    const data = await this.purchaseOrdersService.update(
      userId,
      +id,
      updatePurchaseOrderDto,
    );
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
  async remove(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    const data = await this.purchaseOrdersService.remove(userId, +id);
    return { message: 'Purchase order delete successfully', data };
  }
}
