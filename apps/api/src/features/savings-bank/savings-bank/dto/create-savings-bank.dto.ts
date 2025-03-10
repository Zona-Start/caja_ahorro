import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSavingsBankDto {
  @ApiProperty({ description: 'Name of the savings bank' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'RIF of the savings bank' })
  @IsNotEmpty()
  @IsString()
  rif: string;

  @ApiProperty({ description: 'Address of the savings bank' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Phone number of the savings bank', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Email of the savings bank' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contact person name', required: false })
  @IsOptional()
  @IsString()
  personContact?: string;

  @ApiProperty({ description: 'Contact person phone', required: false })
  @IsOptional()
  @IsString()
  phoneContact?: string;
}