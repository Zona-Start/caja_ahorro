import { CurrencyCodeEnum, invoiceSuppliersStatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseOrder {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty()
  supplierId: number;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  purchaseDate: Date;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: CurrencyCodeEnum, enumName: 'CurrencyCodeEnum' })
  currencyCode?: CurrencyCodeEnum;

  @ApiProperty({ required: false })
  payableId?: number;

  @ApiProperty({
    enum: invoiceSuppliersStatusEnum,
    enumName: 'InvoiceSuppliersStatusEnum',
  })
  status: invoiceSuppliersStatusEnum;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updatedById?: number;
}
