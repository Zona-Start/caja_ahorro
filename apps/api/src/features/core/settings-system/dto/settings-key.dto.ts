import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class KeySettingSystemDto {
  @ApiProperty({ description: 'key get of the settings system' })
  @IsNotEmpty()
  @IsString()
  key: string;
}
