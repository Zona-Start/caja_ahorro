import { ApiProperty } from '@nestjs/swagger';

export class BankAccount {
  @ApiProperty({ description: 'ID único de la cuenta bancaria' })
  id: string;

  @ApiProperty({ description: 'ID del tenant al que pertenece' })
  tenantId: string;

  @ApiProperty({
    description: 'ID del banco al que pertenece la cuenta bancaria',
  })
  bankDirectoryId: string;

  @ApiProperty({ description: 'Número de cuenta bancaria completo' })
  accountNumber: string;

  @ApiProperty({ description: 'Nombre de la cuenta bancaria', required: false })
  accountName?: string;

  @ApiProperty({
    description: 'Tipo de cuenta bancaria (Ej: Corriente, Ahorro)',
  })
  accountType: string;

  @ApiProperty({ description: 'Código de moneda de la cuenta bancaria' })
  currencyCode: string;

  @ApiProperty({
    description: 'Fecha de apertura de la cuenta bancaria',
    required: false,
  })
  openingDate?: Date;

  @ApiProperty({
    description: 'Saldo actual de la cuenta bancaria',
    required: false,
  })
  currentBalance?: string;

  @ApiProperty({
    description: 'Saldo del último extracto cargado',
    required: false,
  })
  lastStatementBalance?: string;

  @ApiProperty({
    description: 'Fecha del último extracto cargado',
    required: false,
  })
  lastStatementDate?: Date;

  @ApiProperty({ description: 'ID de la cuenta contable vinculada' })
  linkedChartAccountId: string;

  @ApiProperty({ description: 'Estado activo de la cuenta bancaria' })
  isActive: boolean;

  @ApiProperty({ description: 'Indica si el asiento de apertura fue generado' })
  openingEntryPosted: boolean;

  @ApiProperty({ description: 'ID de la regla contable', required: false })
  ruleAccountId?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt?: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt?: Date;

  @ApiProperty({ description: 'ID del usuario que creó el registro' })
  createdById?: string;

  @ApiProperty({ description: 'ID del usuario que actualizó el registro' })
  updatedById?: string;
}
