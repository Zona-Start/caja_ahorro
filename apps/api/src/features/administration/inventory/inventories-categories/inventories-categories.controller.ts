import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateInventoryCategoryDto } from './dto/create-inventories-category.dto';
import { FilterInventoryCategoryDto } from './dto/filter-onventories-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventories-category.dto';
import { InventoriesCategoriesService } from './inventories-categories.service';

@Controller('administration/inventory/categories')
export class InventoriesCategoriesController {
  constructor(private readonly services: InventoriesCategoriesService) {}

  @Post()
  @RequirePermissions('create:inventories-categories')
  @ApiOperation({ summary: 'Create a new Categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories created successfully.',
  })
  create(@Req() req: Request, @Body() dto: CreateInventoryCategoryDto) {
    const userId = req['user'].id;
    return this.services.create(userId, dto);
  }

  @Get('/paginated')
  @RequirePermissions('read:inventories-categories')
  @ApiOperation({ summary: 'Get all  Categories' })
  @ApiResponse({ status: 200, description: 'Return all  Categories.' })
  findAll(@Query() paginationDto: FilterInventoryCategoryDto) {
    return this.services.findAll(paginationDto);
  }

  @Get('/all/:group')
  @RequirePermissions('read:inventories-categories')
  @ApiOperation({ summary: 'Get all  Categories' })
  @ApiResponse({ status: 200, description: 'Return all  Categories.' })
  findAllCategories(@Param('group', ParseIntPipe) group: string) {
    return this.services.findAllCategories(group);
  }

  @Get(':id')
  @RequirePermissions('read:inventories-categories')
  @ApiOperation({ summary: 'Get one  Categories' })
  @ApiResponse({ status: 200, description: 'Return one  Categories.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.services.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('update:inventories-categories')
  @ApiOperation({ summary: 'Update one  Categories' })
  @ApiResponse({ status: 200, description: 'Update  Categories.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryCategoryDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    return this.services.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermissions('delete:inventories-categories')
  @ApiOperation({ summary: 'Delete one  Categories' })
  @ApiResponse({ status: 200, description: 'Delete  Categories.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.services.remove(id);
  }
}
