import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { RolePermissionsService } from './role-permissions.service';

@ApiTags('role-permissions')
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Get('role/:roleId')
  @Roles('admin')
  @RequirePermissions('read:role-permissions')
  @ApiOperation({ summary: 'Get permissions by role ID' })
  @ApiResponse({ status: 200, description: 'Return permissions for the role.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  async getPermissionsByRoleId(@Param('roleId') roleId: string) {
    const data =
      await this.rolePermissionsService.getPermissionsByRoleId(+roleId);
    return { message: 'Permissions fetched successfully', data };
  }

  @Post('assign')
  @Roles('admin')
  @RequirePermissions('assign:role-permissions')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Role or permission not found.' })
  async assignPermissionsToRole(
    @Body() assignPermissionDto: AssignPermissionDto,
  ) {
    const data =
      await this.rolePermissionsService.assignPermissionsToRole(
        assignPermissionDto,
      );
    return { message: 'Permissions assigned successfully', data };
  }

  @Delete('role/:roleId/permission/:permissionId')
  @Roles('admin')
  @RequirePermissions('delete:role-permission')
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Role-permission relationship not found.',
  })
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return await this.rolePermissionsService.removePermissionFromRole(
      +roleId,
      +permissionId,
    );
  }
}
