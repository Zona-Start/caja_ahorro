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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFixedAssetsMaintenanceDto } from './dto/create-fixed-assets-maintenance.dto';
import { FilterFixedAssetsMaintenanceDto } from './dto/filter-fixed-assets-maintenance.dto';
import { UpdateFixedAssetsMaintenanceDto } from './dto/update-fixed-assets-maintenance.dto';
import { FixedAssetsMaintenancesService } from './fixed-assets-maintenances.service';

@ApiTags('Inventory - Fixed Assets Maintenances')
@ApiBearerAuth()
@Controller('inventory/assets/fixed-assets-maintenances')
export class FixedAssetsMaintenancesController {
  constructor(
    private readonly fixedAssetsMaintenancesService: FixedAssetsMaintenancesService,
  ) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create_fixed_asset_maintenance')
  @ApiOperation({ summary: 'Create a fixed asset maintenance' })
  @ApiResponse({ status: 201, description: 'Fixed asset maintenance created' })
  create(
    @Req() req: Request,
    @Body() createFixedAssetsMaintenanceDto: CreateFixedAssetsMaintenanceDto,
  ) {
    const userId = req['user'].id;
    return this.fixedAssetsMaintenancesService.create(
      userId,
      createFixedAssetsMaintenanceDto,
    );
  }

  @Get()
  @Roles('admin')
  @RequirePermissions('read_fixed_asset_maintenance')
  @ApiOperation({ summary: 'Get all fixed asset maintenances' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiQuery({ name: 'maintenanceType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query() filterDto: FilterFixedAssetsMaintenanceDto) {
    return this.fixedAssetsMaintenancesService.findAll(filterDto);
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read_fixed_asset_maintenance')
  @ApiOperation({ summary: 'Get a fixed asset maintenance by id' })
  findOne(@Param('id') id: string) {
    return this.fixedAssetsMaintenancesService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update_fixed_asset_maintenance')
  @ApiOperation({ summary: 'Update a fixed asset maintenance' })
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateFixedAssetsMaintenanceDto: UpdateFixedAssetsMaintenanceDto,
  ) {
    const userId = req['user'].id;
    return this.fixedAssetsMaintenancesService.update(
      userId,
      +id,
      updateFixedAssetsMaintenanceDto,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete_fixed_asset_maintenance')
  @ApiOperation({ summary: 'Delete a fixed asset maintenance' })
  remove(@Param('id') id: string) {
    return this.fixedAssetsMaintenancesService.remove(+id);
  }
}
