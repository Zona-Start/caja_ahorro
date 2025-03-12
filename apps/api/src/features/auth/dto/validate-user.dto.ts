import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ValidateUserDto {
  @ApiProperty()
  @IsString({
    message: 'First name must be a string',
  })
  username: string;

  @ApiProperty()
  @IsString({
    message: 'Password must be a string',
  })
  password: string;
}
