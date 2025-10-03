import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class InitialReconciliationDto {
  @ApiProperty()
  @IsBoolean()
  createAdjustment: boolean;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  bankAccountId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  lastStatementBalance: number;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  lastStatementDate: Date;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  reconciliationDate: Date;
}
