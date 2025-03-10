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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  @RequirePermissions('read:users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  async findAll() {
    const data = await this.usersService.findAll();
    return { message: 'Users fetched successfully', data };
  }

  @Get(':id')
  @Roles('ADMIN')
  @RequirePermissions('read:user')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Return the user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { message: 'User fetched successfully', data };
  }

  @Post()
  @Roles('ADMIN')
  @RequirePermissions('create:user')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Query('roleId') roleId?: string,
  ) {
    const data = await this.usersService.create(
      createUserDto,
      roleId ? parseInt(roleId) : undefined,
    );
    return { message: 'User created successfully', data };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @RequirePermissions('update:user')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const data = await this.usersService.update(id, updateUserDto);
    return { message: 'User updated successfully', data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @RequirePermissions('delete:user')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
}
