import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoutePermissionDto {
  @ApiProperty({ description: 'The route path' })
  @IsString()
  @IsNotEmpty()
  route: string;

  @ApiProperty({ description: 'The permission ID' })
  @IsNumber()
  permissionId: number;
}