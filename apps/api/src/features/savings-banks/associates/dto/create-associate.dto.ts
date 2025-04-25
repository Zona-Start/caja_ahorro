import { GenderEnum, NationalityEnum, StatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAssociateDto {
  @ApiProperty({ description: 'Company ID' })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

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
    enum: NationalityEnum,
    enumName: 'NationalityEnum',
  })
  @IsEnum(NationalityEnum)
  @IsNotEmpty()
  nationality: NationalityEnum;

  @ApiProperty({
    description: 'Gender',
    enum: GenderEnum,
    enumName: 'GenderEnum',
  })
  @IsEnum(GenderEnum)
  @IsNotEmpty()
  gender: GenderEnum;

  @ApiProperty({ description: 'Birth date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  birthdate: Date;

  @ApiProperty({ description: 'Date of admission', required: false })
  @IsDate()
  @Type(() => Date)
  dateAdmission: Date;

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
    enum: StatusEnum,
    enumName: 'StatusEnum',
    default: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

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

  @ApiProperty({ description: 'jobTitle/Position', required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ description: 'base Salary', required: true })
  @IsNumber({ maxDecimalPlaces: 2 })
  baseSalary: number;

  @ApiProperty({ description: 'Account number' })
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Bank ID' })
  @IsInt()
  @IsNotEmpty()
  bankDirectoryId: number;
}
