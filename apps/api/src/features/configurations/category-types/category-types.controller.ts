import { Roles } from '@/common/decorators';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryTypesService } from './category-types.service';
import { CreateCategoryTypeDto } from './dto/create-category-type.dto';
import { UpdateCategoryTypeDto } from './dto/update-category-type.dto';
import { CategoryType } from './entities/category-type.entity';

@ApiTags('Category Types')
@Controller('configurations/category-types')
export class CategoryTypesController {
  constructor(private readonly categoryTypesService: CategoryTypesService) {}

  @Get()
  @Roles('admin', 'user')
  @RequirePermissions('read:category-types')
  @ApiOperation({ summary: 'Get all category types' })
  @ApiResponse({
    status: 200,
    description: 'Return all category types',
    type: [CategoryType],
  })
  findAll() {
    return this.categoryTypesService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'user')
  @RequirePermissions('read:category-types')
  @ApiOperation({ summary: 'Get a category type by id' })
  @ApiResponse({
    status: 200,
    description: 'Return a category type',
    type: CategoryType,
  })
  @ApiResponse({ status: 404, description: 'Category type not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryTypesService.findOne(id);
  }

  @Get('group/:group')
  @Roles('admin', 'user')
  @RequirePermissions('read:category-types')
  @ApiOperation({ summary: 'Get category types by group' })
  @ApiResponse({
    status: 200,
    description: 'Return category types by group',
    type: [CategoryType],
  })
  findByGroup(@Param('group') group: string) {
    return this.categoryTypesService.findByGroup(group);
  }

  @Post()
  @Roles('admin')
  @RequirePermissions('create:category-types')
  @ApiOperation({ summary: 'Create a new category type' })
  @ApiResponse({
    status: 201,
    description: 'Category type created',
    type: CategoryType,
  })
  create(@Body() createCategoryTypeDto: CreateCategoryTypeDto) {
    return this.categoryTypesService.create(createCategoryTypeDto);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:category-types')
  @ApiOperation({ summary: 'Update a category type' })
  @ApiResponse({
    status: 200,
    description: 'Category type updated',
    type: CategoryType,
  })
  @ApiResponse({ status: 404, description: 'Category type not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryTypeDto: UpdateCategoryTypeDto,
  ) {
    return this.categoryTypesService.update(id, updateCategoryTypeDto);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:category-types')
  @ApiOperation({ summary: 'Delete a category type' })
  @ApiResponse({ status: 200, description: 'Category type deleted' })
  @ApiResponse({ status: 404, description: 'Category type not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryTypesService.remove(id);
  }
}
