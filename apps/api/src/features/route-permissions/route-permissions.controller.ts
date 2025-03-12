import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRoutePermissionDto } from './dto/create-route-permission.dto';
import { UpdateRoutePermissionDto } from './dto/update-route-permission.dto';
import { RoutePermissionsService } from './route-permissions.service';

@ApiTags('route-permissions')
@Controller('route-permissions')
export class RoutePermissionsController {
  constructor(private readonly routePermissionsService: RoutePermissionsService) {}

  @Get()
  @Roles('admin')
  @RequirePermissions('read:route-permissions')
  @ApiOperation({ summary: 'Get all route permissions' })
  @ApiResponse({ status: 200, description: 'Return all route permissions.' })
  async findAll() {
    const data = await this.routePermissionsService.findAll();
    return { message: 'Route permissions fetched successfully', data };
  }

  @Get('route')
  @Roles('admin')
  @RequirePermissions('read:route-permissions')
  @ApiOperation({ summary: 'Get route permissions by route' })
  @ApiResponse({ status: 200, description: 'Return route permissions for the specified route.' })
  async findByRoute(@Query('path') route: string) {
    const data = await this.routePermissionsService.findByRoute(route);
    return { message: 'Route permissions fetched successfully', data };
  }

  @Get('permissions/route')
  @Roles('admin')
  @RequirePermissions('read:route-permissions')
  @ApiOperation({ summary: 'Get permissions by route' })
  @ApiResponse({ status: 200, description: 'Return permissions for the specified route.' })
  async getPermissionsByRoute(@Query('path') route: string) {
    const data = await this.routePermissionsService.getPermissionsByRoute(route);
    return { message: 'Permissions fetched successfully', data };
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('read:route-permission')
  @ApiOperation({ summary: 'Get a route permission by ID' })
  @ApiResponse({ status: 200, description: 'Return the route permission.' })
  @ApiResponse({ status: 404, description: 'Route permission not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.routePermissionsService.findOne(+id);
    return { message: 'Route permission fetched successfully', data };
  }

  @Post()
  @Roles('admin')
  @RequirePermissions('create:route-permission')
  @ApiOperation({ summary: 'Create a new route permission' })
  @ApiResponse({ status: 201, description: 'Route permission created successfully.' })
  async create(@Body() createRoutePermissionDto: CreateRoutePermissionDto) {
    const data = await this.routePermissionsService.create(createRoutePermissionDto);
    return { message: 'Route permission created successfully', data };
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('update:route-permission')
  @ApiOperation({ summary: 'Update a route permission' })
  @ApiResponse({ status: 200, description: 'Route permission updated successfully.' })
  @ApiResponse({ status: 404, description: 'Route permission not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateRoutePermissionDto: UpdateRoutePermissionDto,
  ) {
    const data = await this.routePermissionsService.update(+id, updateRoutePermissionDto);
    return { message: 'Route permission updated successfully', data };
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('delete:route-permission')
  @ApiOperation({ summary: 'Delete a route permission' })
  @ApiResponse({ status: 200, description: 'Route permission deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Route permission not found.' })
  async remove(@Param('id') id: string) {
    return await this.routePermissionsService.remove(+id);
  }
}