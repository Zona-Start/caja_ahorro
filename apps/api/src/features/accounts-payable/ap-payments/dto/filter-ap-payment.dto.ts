import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaymentMethodEnum, PaymentSuppliersStatusEnum } from '@/types/enum';

export class FilterApPaymentDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Filtrar por ID de cuenta por pagar (factura)', example: 1 })
  @IsOptional()
  @IsNumber()
  payableId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por fecha de pago (inicio)', example: '2023-01-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paymentDateStart?: Date;

  @ApiPropertyOptional({ description: 'Filtrar por fecha de pago (fin)', example: '2023-12-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paymentDateEnd?: Date;

  @ApiPropertyOptional({ description: 'Filtrar por método de pago', enum: PaymentMethodEnum })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;

  @ApiPropertyOptional({ description: 'Filtrar por referencia de transacción', example: 'TRN-XYZ-789' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado del pago', enum: PaymentSuppliersStatusEnum })
  @IsOptional()
  @IsEnum(PaymentSuppliersStatusEnum)
  status?: PaymentSuppliersStatusEnum;
}
