import { invoiceSuppliersStatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID del proveedor', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  supplierId: number;

  @ApiProperty({
    description: 'Número de factura o documento',
    example: 'INV-2023-001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber: string;

  @ApiProperty({ description: 'Fecha de la factura', example: '2023-01-15' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  invoiceDate: Date;

  @ApiProperty({
    description: 'Fecha de vencimiento de la factura',
    example: '2023-02-15',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dueDate: Date;

  @ApiProperty({ description: 'Monto total de la factura', example: 1000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({
    description: 'Concepto de la factura',
    example: 'Compra de materiales de oficina',
  })
  @IsString()
  @IsNotEmpty()
  concept: string;

  // @ApiProperty({ description: 'Monto ya pagado', example: 0.00, required: false })
  // @IsNumber({ maxDecimalPlaces: 2 })
  // @Min(0)
  // @IsOptional()
  // paidAmount?: number;

  // @ApiProperty({ description: 'Saldo pendiente', example: 1000.00, required: false })
  // @IsNumber({ maxDecimalPlaces: 6 })
  // @Min(0)
  // @IsOptional()
  // remainingAmount?: number;

  // @ApiProperty({ description: 'Código de la moneda', enum: CurrencyCodeEnum, example: CurrencyCodeEnum.USD })
  // @IsEnum(CurrencyCodeEnum)
  // @IsNotEmpty()
  // currencyCode: CurrencyCodeEnum;

  @ApiProperty({
    description: 'Estado de la factura',
    enum: invoiceSuppliersStatusEnum,
    example: invoiceSuppliersStatusEnum.PENDING,
    required: false,
  })
  @IsEnum(invoiceSuppliersStatusEnum)
  @IsOptional()
  status?: invoiceSuppliersStatusEnum;

  @ApiProperty({ description: 'Observaciones adicionales', required: false })
  @IsString()
  @IsOptional()
  observations?: string;
}
