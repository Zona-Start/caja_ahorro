import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString({
    message: 'Refresh token must be a string',
  })
  refreshToken: string;

  @ApiProperty()
  @IsNumber()
  userId: number;
}
