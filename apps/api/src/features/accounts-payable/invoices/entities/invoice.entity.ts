import { CurrencyCodeEnum, invoiceSuppliersStatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class Invoice {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty()
  supplierId: number;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  invoiceDate: Date;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  concept: string;

  @ApiProperty()
  paidAmount: number;

  @ApiProperty()
  remainingAmount: number;

  @ApiProperty({ enum: CurrencyCodeEnum, enumName: 'CurrencyCodeEnum' })
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({
    enum: invoiceSuppliersStatusEnum,
    enumName: 'InvoiceSuppliersStatusEnum',
  })
  status: invoiceSuppliersStatusEnum;

  @ApiProperty({ required: false })
  observations?: string;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updatedById?: number;
}
