import { Permissions } from '@/common/decorators/permissions.decorator';
import {
  Body,
  ConflictException,
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
import { ClsService } from 'nestjs-cls';
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
    private readonly cls: ClsService,
  ) {}

  @Post()
  @Permissions({ resource: 'iam:users', action: 'create', scope: 'tenant' })
  async create(@Body() dto: CreateUserDto, @Req() req: RequestWithUser) {
    const isSystemAdmin = (req.user as any).isSystemAdmin;
    const currentTenantId = this.cls.get('tenantId');

    return this.usersService.create(
      dto,
      isSystemAdmin ? undefined : currentTenantId,
    );
  }

  @Get()
  @Permissions({ resource: 'iam:users', action: 'read', scope: 'tenant' })
  async findAll(@Query() dto: UserQueryDto, @Req() req: RequestWithUser) {
    const isSystemAdmin = (req.user as any).isSystemAdmin;
    const currentTenantId = this.cls.get('tenantId');

    return this.usersService.findAll(
      dto,
      isSystemAdmin ? dto.tenantId : currentTenantId,
    );
  }

  @Get(':id')
  @Permissions({ resource: 'iam:users', action: 'read', scope: 'tenant' })
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isSystemAdmin = (req.user as any).isSystemAdmin;
    const currentTenantId = this.cls.get('tenantId');

    return this.usersService.findById(
      id,
      isSystemAdmin ? undefined : currentTenantId,
    );
  }

  @Patch(':id')
  @Permissions({ resource: 'iam:users', action: 'update', scope: 'tenant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const isSystemAdmin = (req.user as any).isSystemAdmin;
    const currentTenantId = this.cls.get('tenantId');

    return this.usersService.update(
      id,
      dto,
      isSystemAdmin ? undefined : currentTenantId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({ resource: 'iam:users', action: 'delete', scope: 'tenant' })
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isSystemAdmin = (req.user as any).isSystemAdmin;
    const currentTenantId = this.cls.get('tenantId');

    return this.usersService.remove(
      id,
      isSystemAdmin ? undefined : currentTenantId,
    );
  }

  @Post(':id/permissions')
  @Permissions({ resource: 'iam:users', action: 'update', scope: 'tenant' })
  async managePermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[]; tenantId?: string },
    @Req() req: RequestWithUser,
  ) {
    const isSystemAdmin = (req.user as any).isSystemAdmin;
    const currentTenantId = this.cls.get('tenantId');

    // El tenantId objetivo es el de la sesión, o el del body si es superadmin
    const targetTenantId =
      (isSystemAdmin ? body.tenantId : currentTenantId) || body.tenantId;

    if (!targetTenantId) {
      throw new ConflictException(
        'Tenant ID is required for special permissions',
      );
    }

    return this.usersService.managePermissions(
      id,
      targetTenantId,
      body.permissionIds,
    );
  }
}
