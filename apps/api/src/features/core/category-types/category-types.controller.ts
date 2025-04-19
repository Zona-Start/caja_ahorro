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
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryTypesService } from './category-types.service';
import { CreateCategoryTypeDto } from './dto/create-category-type.dto';
import { FilterCategoryTypeDto } from './dto/filter-category-type.dto';
import { UpdateCategoryTypeDto } from './dto/update-category-type.dto';
import { CategoryType } from './entities/category-type.entity';

@ApiTags('category-types')
@Controller('core/category-types')
export class CategoryTypesController {
  constructor(private readonly categoryTypesService: CategoryTypesService) {}

  @Get()
  @RequirePermissions('read:category-types')
  @ApiOperation({ summary: 'Get all category types' })
  @ApiResponse({
    status: 200,
    description: 'Return all category types',
    type: [CategoryType],
  })
  async findAll() {
    const data = await this.categoryTypesService.findAll();
    return { message: 'Category Types fetched successfully', data };
  }

  @Get('paginated')
  @RequirePermissions('read:category-types')
  @ApiOperation({
    summary: 'Get all account plans with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Return paginated account plans .' })
  async findAllByPagination(@Query() paginationDto: FilterCategoryTypeDto) {
    const result =
      await this.categoryTypesService.findAllByPagination(paginationDto);
    return {
      message: 'category types fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('group/:group')
  @RequirePermissions('read:category-types')
  @ApiOperation({ summary: 'Get category types by group' })
  @ApiResponse({
    status: 200,
    description: 'Return category types by group',
    type: [CategoryType],
  })
  async findByGroup(@Param('group') group: string) {
    const data = await this.categoryTypesService.findByGroup(group);
    return { message: 'Category Type fetched successfully', data };
  }

  @Get('/:id')
  @RequirePermissions('read:category-types')
  @ApiOperation({ summary: 'Get a category type by id' })
  @ApiResponse({
    status: 200,
    description: 'Return a category type',
    type: CategoryType,
  })
  @ApiResponse({ status: 404, description: 'Category type not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoryTypesService.findOne(id);
    return { message: 'Category Type fetched successfully', data };
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
  async create(
    @Req() req: Request, // Obtenemos el request completo para acceder a las cookies
    @Body() createCategoryTypeDto: CreateCategoryTypeDto,
  ) {
    const createdById = req['user'].id; // Accedemos al id del usuario que hizo la petición
    const data = await this.categoryTypesService.create(
      createdById,
      createCategoryTypeDto,
    );
    return { message: 'Category Type created successfully', data };
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
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryTypeDto: UpdateCategoryTypeDto,
  ) {
    const updateById = req['user'].id;
    const data = await this.categoryTypesService.update(
      updateById,
      id,
      updateCategoryTypeDto,
    );
    return { message: 'Category Type updated successfully', data };
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
