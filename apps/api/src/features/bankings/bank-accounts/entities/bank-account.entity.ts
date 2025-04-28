import { CurrencyCodeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class BankAccount {
  @ApiProperty({ description: 'ID único de la cuenta bancaria' })
  id: number;

  @ApiProperty({
    description: 'ID de la compañía propietaria de la cuenta bancaria',
  })
  companyId: number;

  @ApiProperty({
    description: 'ID del banco al que pertenece la cuenta bancaria',
  })
  bankDirectoryId: number;

  @ApiProperty({ description: 'Número de cuenta bancaria completo' })
  accountNumber: string;

  @ApiProperty({ description: 'Nombre de la cuenta bancaria', required: false })
  accountName?: string;

  @ApiProperty({
    description: 'Tipo de cuenta bancaria (Ej: Corriente, Ahorro)',
  })
  accountType: string;

  @ApiProperty({ description: 'Código de moneda de la cuenta bancaria' })
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({ description: 'Fecha de apertura de la cuenta bancaria' })
  openingDate?: Date;

  @ApiProperty({ description: 'Saldo inicial de la cuenta bancaria' })
  currentBalance?: number;

  @ApiProperty({ description: 'Saldo del último extracto cargado' })
  lastStatementBalance?: number;

  @ApiProperty({ description: 'Fecha del último extracto cargado' })
  lastStatementDate?: Date;

  @ApiProperty({ description: 'ID de la cuenta contable vinculada' })
  linkedChartAccountId: number;

  @ApiProperty({ description: 'Estado activo de la cuenta bancaria' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación de la cuenta bancaria' })
  createdAt?: Date;

  @ApiProperty({
    description: 'Fecha de última actualización de la cuenta bancaria',
  })
  updatedAt?: Date;

  @ApiProperty({
    description: 'Usuario Fecha de creación de la cuenta bancaria',
  })
  createdById?: Date;

  @ApiProperty({
    description: 'Usuario fecha última actualización de la cuenta bancaria',
  })
  updatedById?: Date;
}
