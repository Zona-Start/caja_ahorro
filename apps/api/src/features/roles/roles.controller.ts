import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('ADMIN')
  @RequirePermissions('read:roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Return all roles.' })
  async findAll() {
    const data = await this.rolesService.findAll();
    return { message: 'Roles fetched successfully', data };
  }

  @Get(':id')
  @Roles('ADMIN')
  @RequirePermissions('read:role')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: 200, description: 'Return the role.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.rolesService.findOne(+id);
    return { message: 'Role fetched successfully', data };
  }

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:role')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully.' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.rolesService.create(createRoleDto);
    return { message: 'Role created successfully', data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:role')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const data = await this.rolesService.update(+id, updateRoleDto);
    return { message: 'Role updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @RequirePermissions('delete:role')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  async remove(@Param('id') id: string) {
    return await this.rolesService.remove(+id);
  }
}
