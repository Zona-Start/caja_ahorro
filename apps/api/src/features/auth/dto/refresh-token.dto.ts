import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString({
    message: 'Refresh token must be a string',
  })
  refresh_token: string;

  @ApiProperty()
  @IsNumber()
  user_id: number;
}
