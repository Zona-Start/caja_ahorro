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
import { CreateFixedAssetCategoryDto } from './dto/create-fixed-assets-category.dto';
import { UpdateFixedAssetsCategoryDto } from './dto/update-fixed-assets-category.dto';
import { FixedAssetCategoriesService } from './fixed-assets-categories.service';

@ApiTags('inventory/assets/fixed-asset-categories')
@Controller('inventory/assets/fixed-asset-categories')
export class FixedAssetCategoriesController {
  constructor(
    private readonly fixedAssetCategoriesService: FixedAssetCategoriesService,
  ) {}

  @Post()
  @Roles('admin')
  @RequirePermissions('create:fixed-asset-category')
  @ApiOperation({ summary: 'Create a new fixed asset category' })
  @ApiResponse({
    status: 201,
    description: 'Fixed asset category created successfully.',
  })
  async create(
    @Req() req: Request,
    @Body() createFixedAssetCategoryDto: CreateFixedAssetCategoryDto,
  ) {
    const userId = req['user'].id;
    const data = await this.fixedAssetCategoriesService.create(
      userId,
      createFixedAssetCategoryDto,
    );
    return { message: 'Fixed asset category created successfully', data };
  }

  @Get('/paginated')
  @Roles('admin')
  @RequirePermissions('read:fixed-asset-categories')
  @ApiOperation({ summary: 'Get all fixed asset categories' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Return all fixed asset categories.',
  })
  async findAll(@Query() paginationDto: any) {
    const result =
      await this.fixedAssetCategoriesService.findAll(paginationDto);
    return {
      message: 'Fixed asset categories fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('/all')
  @RequirePermissions('read:fixed-asset-categories')
  @ApiOperation({ summary: 'Get all fixed asset Categories' })
  @ApiResponse({
    status: 200,
    description: 'Return all fixed asset Categories.',
  })
  findAllCategories() {
    return this.fixedAssetCategoriesService.findAllCategories();
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:fixed-asset-category')
  @ApiOperation({ summary: 'Get a fixed asset category by ID' })
  @ApiResponse({ status: 200, description: 'Return the fixed asset category.' })
  @ApiResponse({ status: 404, description: 'Fixed asset category not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.fixedAssetCategoriesService.findOne(+id);
    return { message: 'Fixed asset category fetched successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:fixed-asset-category')
  @ApiOperation({ summary: 'Update a fixed asset category' })
  @ApiResponse({
    status: 200,
    description: 'Fixed asset category updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Fixed asset category not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateFixedAssetCategoryDto: UpdateFixedAssetsCategoryDto,
  ) {
    const userId = req['user'].id;
    const data = await this.fixedAssetCategoriesService.update(
      userId,
      +id,
      updateFixedAssetCategoryDto,
    );
    return { message: 'Fixed asset category updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:fixed-asset-category')
  @ApiOperation({ summary: 'Delete a fixed asset category' })
  @ApiResponse({
    status: 200,
    description: 'Fixed asset category deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Fixed asset category not found.' })
  async remove(@Param('id') id: string) {
    return await this.fixedAssetCategoriesService.remove(+id);
  }
}
