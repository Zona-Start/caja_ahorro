import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AppliedAdvanceDto {
  @ApiProperty({
    description: 'CXP ID (Accounts Payable ID for advance or credit note)',
  })
  @IsInt()
  cxpId: number;

  @ApiProperty({ description: 'Amount to apply from the credit' })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Origin of the credit (e.g., ANTICIPO, NOTA_DE_CREDITO)',
  })
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty({ description: 'Number of the CXP document' })
  @IsString()
  @IsNotEmpty()
  cxpNumber: string;
}