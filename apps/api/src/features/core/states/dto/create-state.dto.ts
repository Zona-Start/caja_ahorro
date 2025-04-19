import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStateDto {
  @ApiProperty({
    description: 'The name of the state',
    example: 'California',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}