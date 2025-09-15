import { CurrencyCodeEnum, paymentBatchItemType } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateSinglePaymentBatchItemDto {
  @ApiProperty({ enum: paymentBatchItemType })
  @IsEnum(paymentBatchItemType)
  @IsNotEmpty()
  type: paymentBatchItemType;

  @ApiProperty({ description: 'ID del préstamo, retiro o liquidación' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  sourceId: number;

  @ApiProperty({ description: 'Cuenta bancaria destino (número)' })
  @IsString()
  @IsNotEmpty()
  beneficiaryAccountNumber: string;

  @ApiProperty({ description: 'CI / RIF del beneficiario' })
  @IsString()
  @IsNotEmpty()
  beneficiaryId: string;

  @ApiProperty({ description: 'Nombre completo del beneficiario' })
  @IsString()
  @IsNotEmpty()
  beneficiaryName: string;

  @ApiProperty({ enum: CurrencyCodeEnum })
  @IsEnum(CurrencyCodeEnum)
  @IsNotEmpty()
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({ description: 'Monto neto a desembolsar' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Cuenta bancaria origen (ID)' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  bankAccountId: number;
}
