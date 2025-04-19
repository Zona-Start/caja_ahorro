import { ActionEnumAudit } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateActivityLogsSystemDto {
  @ApiProperty({ description: 'User type errors', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({
    description: 'type errors system',
    enum: ActionEnumAudit,
    enumName: 'ActionEnumAudit',
  })
  @IsEnum(ActionEnumAudit)
  @IsNotEmpty()
  type: ActionEnumAudit;

  @ApiProperty({ description: 'description log' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'date log' })
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;
}
