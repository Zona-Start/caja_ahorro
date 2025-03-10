import { PartialType } from '@nestjs/swagger';
import { CreateRoutePermissionDto } from './create-route-permission.dto';

export class UpdateRoutePermissionDto extends PartialType(CreateRoutePermissionDto) {}