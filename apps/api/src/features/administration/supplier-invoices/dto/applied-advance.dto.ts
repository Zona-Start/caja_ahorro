import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber } from 'class-validator';

export class AppliedAdvanceDto {
  @ApiProperty({ description: 'Advance ID (Accounts Payable ID)' })
  @IsInt()
  advanceId: number;

  @ApiProperty({ description: 'Amount to apply from the advance' })
  @IsNumber()
  amount: number;
}
