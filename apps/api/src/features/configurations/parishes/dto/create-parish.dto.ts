import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateParishDto {
  @ApiProperty({
    description: 'The name of the parish',
    example: 'Downtown',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The ID of the municipality this parish belongs to',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  municipalityId: number;
}