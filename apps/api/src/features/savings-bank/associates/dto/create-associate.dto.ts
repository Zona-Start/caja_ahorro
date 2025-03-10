import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAssociateDto {
  @ApiProperty({ description: 'Savings bank ID' })
  @IsInt()
  @IsNotEmpty()
  savingsBankId: number;

  @ApiProperty({ description: 'Cedula of the associate' })
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @ApiProperty({ description: 'Full name of the associate' })
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @ApiProperty({
    description: 'Nationality',
    enum: ['VENEZOLANO', 'EXTRANJERO'],
  })
  @IsEnum(['VENEZOLANO', 'EXTRANJERO'])
  @IsNotEmpty()
  nationality: 'VENEZOLANO' | 'EXTRANJERO';

  @ApiProperty({ description: 'Gender', enum: ['MASCULINO', 'FEMENINO'] })
  @IsEnum(['MASCULINO', 'FEMENINO'])
  @IsNotEmpty()
  gender: 'MASCULINO' | 'FEMENINO';

  @ApiProperty({ description: 'Birth date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  birthdate: Date;

  @ApiProperty({ description: 'Date of admission', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateAdmission?: Date;

  @ApiProperty({ description: 'Date of graduation', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateGraduation?: Date;

  @ApiProperty({ description: 'Discount frequency ID', required: false })
  @IsOptional()
  @IsInt()
  discountFrequencyId?: number;

  @ApiProperty({
    description: 'Status',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({
    description: 'Has payroll credit',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isPayrollCredit?: boolean;

  @ApiProperty({ description: 'Locality ID', required: false })
  @IsOptional()
  @IsInt()
  localityId?: number;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Payroll type ID', required: false })
  @IsOptional()
  @IsInt()
  payrollTypeId?: number;

  @ApiProperty({ description: 'Worker type ID', required: false })
  @IsOptional()
  @IsInt()
  workerTypeId?: number;

  @ApiProperty({ description: 'Charge/Position', required: false })
  @IsOptional()
  @IsString()
  charge?: string;
}
