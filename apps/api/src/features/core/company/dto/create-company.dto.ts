import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Name of the company' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'RIF of the company' })
  @IsNotEmpty()
  @IsString()
  rif: string;

  @ApiProperty({ description: 'Address of the company' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Phone number of the company', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Email of the company' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contact person name', required: false })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiProperty({ description: 'Contact person phone', required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ description: 'Contact person email', required: false })
  @IsOptional()
  @IsString()
  contactEmail?: string;
}
