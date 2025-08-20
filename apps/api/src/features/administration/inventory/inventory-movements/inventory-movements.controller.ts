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
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { FilterInventoryMovementDto } from './dto/filter-inventory-movement.dto';
import { InventoryMovementsService } from './inventory-movements.service';

@ApiTags('inventory/inventory-movements')
@Controller('inventory/inventory-movements')
export class InventoryMovementsController {
  constructor(private readonly services: InventoryMovementsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:inventory-movement')
  @ApiOperation({ summary: 'Create a new inventory movement' })
  @ApiResponse({
    status: 201,
    description: 'Inventory movement created successfully.',
  })
  async create(@Req() req: Request, @Body() dto: CreateInventoryMovementDto) {
    const userId = req['user'].id;
    const data = await this.services.create(userId, dto);
    return { message: 'Inventory movement created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:inventory-movements')
  @ApiOperation({ summary: 'Get all inventory movements' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all inventory movements.' })
  async findAll(@Query() paginationDto: FilterInventoryMovementDto) {
    const result = await this.services.findAll(paginationDto);
    return {
      message: 'Inventory movements fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/stock/:itemType/:itemId')
  @Roles('admin')
  @RequirePermissions('read:inventory-movements')
  @ApiOperation({ summary: 'Get stock for an item' })
  @ApiResponse({ status: 200, description: 'Return item stock.' })
  async getItemStock(
    @Param('itemType') itemType: 'PRODUCT' | 'FIXED_ASSET',
    @Param('itemId') itemId: string,
  ) {
    const data = await this.services.getItemStock(+itemId, itemType);
    return { message: 'Item stock fetched successfully', data };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:inventory-movement')
  @ApiOperation({ summary: 'Get an inventory movement by ID' })
  @ApiResponse({ status: 200, description: 'Return the inventory movement.' })
  @ApiResponse({ status: 404, description: 'Inventory movement not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.services.findOne(+id);
    return { message: 'Inventory movement fetched successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:inventory-movement')
  @ApiOperation({ summary: 'Delete an inventory movement' })
  @ApiResponse({
    status: 200,
    description: 'Inventory movement deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Inventory movement not found.' })
  async remove(@Param('id') id: string) {
    return await this.services.remove(+id);
  }
}
