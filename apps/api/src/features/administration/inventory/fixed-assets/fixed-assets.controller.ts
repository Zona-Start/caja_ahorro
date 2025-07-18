import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { FilterFixedAssetDto } from './dto/filter-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { FixedAssetsService } from './fixed-assets.service';

@Controller('inventory/assets/fixed-assets')
export class FixedAssetsController {
  constructor(private readonly fixedAssetsService: FixedAssetsService) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:fixed-assets')
  @ApiOperation({ summary: 'Create a new fixed assets' })
  @ApiResponse({
    status: 201,
    description: 'Fixed assets created successfully.',
  })
  async create(
    @Req() req: Request,
    @Body() createFixedAssetDto: CreateFixedAssetDto,
  ) {
    const userId = req['user'].id;
    const data = await this.fixedAssetsService.create(
      userId,
      createFixedAssetDto,
    );
    return { message: 'Fixed assets created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:fixed-assets')
  @ApiOperation({ summary: 'Get all fixed assets with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Return all fixed assets.' })
  async findAll(@Query() paginationDto: FilterFixedAssetDto) {
    const result = await this.fixedAssetsService.findAll(paginationDto);
    return {
      message: 'Fixed assets fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/all')
  @RequirePermissions('read:fixed-assets')
  @ApiOperation({ summary: 'Get all fixed assets' })
  @ApiResponse({ status: 200, description: 'Return all fixed assets.' })
  async findAllFixet() {
    const result = await this.fixedAssetsService.findAllFixet();
    return {
      message: 'Fixed assets fetched successfully',
      data: result,
    };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:fixed-assets')
  @ApiOperation({ summary: 'Get a fixed assets by ID' })
  @ApiResponse({ status: 200, description: 'Return the fixed assets.' })
  @ApiResponse({ status: 404, description: 'Fixed assets not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.fixedAssetsService.findOne(+id);
    return { message: 'Fixed assets fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:fixed-assets')
  @ApiOperation({ summary: 'Update a fixed assets' })
  @ApiResponse({
    status: 200,
    description: 'Fixed assets updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Fixed assets not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateFixedAssetDto: UpdateFixedAssetDto,
  ) {
    const userId = req['user'].id;
    const data = await this.fixedAssetsService.update(
      userId,
      +id,
      updateFixedAssetDto,
    );
    return { message: 'Fixed assets updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:fixed-assets')
  @ApiOperation({ summary: 'Delete a fixed assets' })
  @ApiResponse({
    status: 200,
    description: 'Fixed assets deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Fixed assets not found.' })
  async remove(@Param('id') id: string) {
    return await this.fixedAssetsService.remove(+id);
  }
}
