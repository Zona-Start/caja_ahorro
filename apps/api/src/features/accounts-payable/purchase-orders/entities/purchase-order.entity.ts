import { ApiProperty } from '@nestjs/swagger';
import { CurrencyCodeEnum, InvoiceSuppliersStatusEnum } from '@/types/enum';

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
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({ required: false })
  payableId?: number;

  @ApiProperty({ enum: InvoiceSuppliersStatusEnum, enumName: 'InvoiceSuppliersStatusEnum' })
  status: InvoiceSuppliersStatusEnum;

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
