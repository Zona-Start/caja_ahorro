import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UserRolesService } from './user-roles.service';

@ApiTags('user-roles')
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get('user/:userId')
  @Roles('ADMIN')
  @RequirePermissions('read:user-roles')
  @ApiOperation({ summary: 'Get roles by user ID' })
  @ApiResponse({ status: 200, description: 'Return roles for the user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getRolesByUserId(@Param('userId') userId: string) {
    const data = await this.userRolesService.getRolesByUserId(+userId);
    return { message: 'Roles fetched successfully', data };
  }

  @Post('assign')
  @Roles('ADMIN')
  @RequirePermissions('assign:user-role')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully.' })
  @ApiResponse({ status: 404, description: 'User or role not found.' })
  async assignRoleToUser(@Body() assignRoleDto: AssignRoleDto) {
    const data = await this.userRolesService.assignRoleToUser(assignRoleDto);
    return { message: 'Role assigned successfully', data };
  }

  @Delete('user/:userId/role/:roleId')
  @Roles('ADMIN')
  @RequirePermissions('delete:user-role')
  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiResponse({ status: 200, description: 'Role removed successfully.' })
  @ApiResponse({
    status: 404,
    description: 'User-role relationship not found.',
  })
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return await this.userRolesService.removeRoleFromUser(+userId, +roleId);
  }
}
