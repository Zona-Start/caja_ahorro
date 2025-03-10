import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsEmail()
  fullname: string;

  @ApiProperty()
  @IsString({
    message: 'Phone must be a string',
  })
  @IsOptional()
  phone: string;

  @ApiProperty()
  @IsString({
    message: 'Password must be a string',
  })
  password: string;
}
