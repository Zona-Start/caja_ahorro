import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSettingSystemDto {
  @ApiProperty({ description: 'key of the settings system' })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({ description: 'Value of the settings' })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiProperty({ description: 'Desciption of the settings' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Group of the settings' })
  @IsNotEmpty()
  @IsString()
  group: string;
}
