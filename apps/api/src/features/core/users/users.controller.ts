import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request as Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserQueryDto } from './dtos/user-query.dto';
import { UsersService } from './users.service';

// Define la estructura del usuario que esperas
interface RequestWithUser extends Request {
  user: {
    id: string;
    username: string;
    isSystemAdmin: boolean;
  };
}

@Controller('core/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantService: TenantContextService,
  ) {}

  @Post()
  @Permissions({ resource: 'iam:users', action: 'create', scope: 'tenant' })
  async create(@Body() dto: CreateUserDto, @Req() req: RequestWithUser) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );

    return this.usersService.create(dto, targetTenantId, userId);
  }

  @Get()
  @Permissions({ resource: 'iam:users', action: 'read', scope: 'tenant' })
  async findAll(@Query() dto: UserQueryDto, @Req() req: RequestWithUser) {
    const { targetTenantId } = this.tenantService.getTenantContext(req, dto);
    return this.usersService.findAll(dto, targetTenantId);
  }

  @Get(':id')
  @Permissions({ resource: 'iam:users', action: 'read', scope: 'tenant' })
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Query('tenantId') tenantId: string,
  ) {
    const { targetTenantId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );

    return this.usersService.findById(id, targetTenantId);
  }

  @Patch(':id')
  @Permissions({ resource: 'iam:users', action: 'update', scope: 'tenant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      dto,
    );

    return this.usersService.update(id, dto, targetTenantId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({ resource: 'iam:users', action: 'delete', scope: 'tenant' })
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Query('tenantId') tenantId: string,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      tenantId,
    );

    return this.usersService.remove(id, targetTenantId, userId);
  }

  @Post(':id/permissions')
  @Permissions({ resource: 'iam:users', action: 'update', scope: 'tenant' })
  async managePermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[]; tenantId?: string },
    @Req() req: RequestWithUser,
  ) {
    const { targetTenantId, userId } = this.tenantService.getTenantContext(
      req,
      body,
    );

    return this.usersService.managePermissions(
      id,
      targetTenantId,
      body.permissionIds,
      userId,
    );
  }
}
