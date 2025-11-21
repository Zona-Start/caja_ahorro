import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class CloseCycleDto {
  @ApiProperty({ description: 'Is this a fiscal year end closing?' })
  @IsBoolean()
  @IsOptional()
  isFiscalYearEnd?: boolean;
}
