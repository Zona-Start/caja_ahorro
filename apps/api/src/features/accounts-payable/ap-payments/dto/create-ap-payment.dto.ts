import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethodEnum, PaymentSuppliersStatusEnum } from '@/types/enum';

export class CreateApPaymentDto {
  @ApiProperty({ description: 'ID de la cuenta por pagar (factura)', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  payableId: number;

  @ApiProperty({ description: 'Fecha del pago', example: '2023-03-01' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  paymentDate: Date;

  @ApiProperty({ description: 'Monto pagado', example: 500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  amountPaid: number;

  @ApiProperty({ description: 'Método de pago', enum: PaymentMethodEnum, example: PaymentMethodEnum.BANK_TRANSFER })
  @IsEnum(PaymentMethodEnum)
  @IsNotEmpty()
  paymentMethod: PaymentMethodEnum;

  @ApiProperty({ description: 'Referencia de la transacción (ej. número de cheque, transferencia)', example: 'TRN-XYZ-789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  transactionReference: string;

  @ApiProperty({ description: 'Estado del pago', enum: PaymentSuppliersStatusEnum, example: PaymentSuppliersStatusEnum.PROCESSED, required: false })
  @IsEnum(PaymentSuppliersStatusEnum)
  @IsOptional()
  status?: PaymentSuppliersStatusEnum;

  @ApiProperty({ description: 'Observaciones adicionales', required: false })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiProperty({ description: 'Indica si el pago fue revertido', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isReversed?: boolean;
}
