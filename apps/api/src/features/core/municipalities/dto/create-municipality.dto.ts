import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMunicipalityDto {
  @ApiProperty({
    description: 'The name of the municipality',
    example: 'Los Angeles',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The ID of the state this municipality belongs to',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  stateId: number;
}