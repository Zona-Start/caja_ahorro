import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNumber()
  roleId: number;
}