import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Roles('ADMIN')
  @RequirePermissions('read:permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Return all permissions.' })
  async findAll() {
    const data = await this.permissionsService.findAll();
    return { message: 'Permissions fetched successfully', data };
  }

  @Get(':id')
  @Roles('ADMIN')
  @RequirePermissions('read:permission')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiResponse({ status: 200, description: 'Return the permission.' })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.permissionsService.findOne(+id);
    return { message: 'Permission fetched successfully', data };
  }

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:permission')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully.' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const data = await this.permissionsService.create(createPermissionDto);
    return { message: 'Permission created successfully', data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:permission')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully.' })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const data = await this.permissionsService.update(+id, updatePermissionDto);
    return { message: 'Permission updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @RequirePermissions('delete:permission')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  async remove(@Param('id') id: string) {
    return await this.permissionsService.remove(+id);
  }
}
