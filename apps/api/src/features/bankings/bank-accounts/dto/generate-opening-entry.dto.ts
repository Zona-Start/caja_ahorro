import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class GenerateOpeningEntryDto {
  @ApiProperty({ description: 'Saldo inicial de la cuenta bancaria' })
  @IsNotEmpty()
  @IsNumber()
  currentBalance: number;

  @ApiProperty({
    description: 'ID de la regla contable para el asiento de apertura',
  })
  @IsNotEmpty()
  @IsNumber()
  accountingRuleId: number;

  @ApiProperty({
    description: 'Fecha del asiento de apertura',
    example: '2024-01-13',
  })
  @IsNotEmpty()
  @IsDateString()
  openingDate: string;
}
