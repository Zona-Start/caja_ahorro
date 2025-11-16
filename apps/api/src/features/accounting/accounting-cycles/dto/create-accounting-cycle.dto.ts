import { CycleStatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAccountingCycleDto {
  @ApiProperty({ description: 'Company ID' })
  @IsInt()
  companyId: number;

  @ApiProperty({ description: 'Start Date e.g 03/03/2025' })
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ description: 'End Date e.g 03/03/2025' })
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({
    description: 'Status:  OPEN, CLOSED',
    enum: CycleStatusEnum,
    enumName: 'CycleStatusEnum',
  })
  @IsEnum(CycleStatusEnum)
  @IsOptional()
  status?: CycleStatusEnum;

  @ApiProperty({ description: 'description: Cycle Accouting January 2025' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'User ID closed cycle', required: false })
  @IsInt()
  @IsOptional()
  closedByUser_id?: number;

  @ApiProperty({
    description: 'Date for closed cycle e.g 03/03/2025',
    required: false,
  })
  @IsOptional()
  @IsDate()
  closedAt?: Date;
}
