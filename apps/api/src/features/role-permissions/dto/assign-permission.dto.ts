import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty()
  @IsNumber()
  roleId: number;

  @ApiProperty({ type: [Number] })
  @IsArray()
  permissionIds: number[];
}