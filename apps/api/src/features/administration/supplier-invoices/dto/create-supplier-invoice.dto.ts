import {
  currencyCodeEnum,
  invoiceSuppliersStatusEnum,
  paymentMethodEnum,
  purchaseOrderTypeEnum,
  supplierInvoicesPaymentEnum,
} from '@/database/schema/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AppliedAdvanceDto } from './applied-advance.dto';

class SupplierInvoiceItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsInt()
  @IsOptional()
  id: number;

  @ApiProperty({ description: 'Line type' })
  @IsEnum(purchaseOrderTypeEnum.enumValues)
  @IsNotEmpty()
  lineType: (typeof purchaseOrderTypeEnum.enumValues)[number];

  @ApiProperty({ description: 'Item ID' })
  @IsInt()
  @IsOptional()
  itemId: number;

  @ApiProperty({ description: 'Description' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: 'Unit cost' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNotEmpty()
  unitCost: number;

  @ApiProperty({ description: 'Total line' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  totalLine: number;

  @ApiProperty({ description: 'Expense Account' })
  @IsInt()
  @IsOptional()
  expenseAccountId: number;
}

export class CreateSupplierInvoiceDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @ApiPropertyOptional({ description: 'Purchase Order ID' })
  @IsInt()
  @IsOptional()
  purchaseOrderId?: number;

  @ApiProperty({ description: 'Invoice number' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiPropertyOptional({ description: 'Control number' })
  @IsString()
  @IsOptional()
  controlNumber?: string;

  @ApiProperty({ description: 'Invoice date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  invoiceDate: Date;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @ApiProperty({ description: 'Subtotal' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  subtotal: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({ description: 'Total amount' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({
    description: 'Currency code',
    enum: currencyCodeEnum.enumValues,
  })
  @IsEnum(currencyCodeEnum.enumValues)
  @IsOptional()
  currencyCode: (typeof currencyCodeEnum.enumValues)[number];

  @ApiPropertyOptional({
    description: 'Payment type',
    enum: supplierInvoicesPaymentEnum.enumValues,
  })
  @IsEnum(supplierInvoicesPaymentEnum.enumValues)
  @IsOptional()
  paymentType?: (typeof supplierInvoicesPaymentEnum.enumValues)[number];

  @ApiPropertyOptional({
    description: 'Status',
    enum: invoiceSuppliersStatusEnum.enumValues,
  })
  @IsEnum(invoiceSuppliersStatusEnum.enumValues)
  @IsOptional()
  status?: (typeof invoiceSuppliersStatusEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Observations' })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiProperty({ type: () => [SupplierInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierInvoiceItemDto)
  items: SupplierInvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Bank account ID' })
  @IsInt()
  @IsOptional()
  bankAccountId: number;

  @ApiPropertyOptional({ description: 'Charge payment' })
  @IsOptional()
  @IsBoolean()
  chargePayment: boolean;

  @ApiPropertyOptional({ description: 'Payment bank reference' })
  @IsString()
  @IsOptional()
  paymentBankReference: string;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsString()
  @IsOptional()
  paymentDescription: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  transactionDate: Date;

  @ApiPropertyOptional({
    description: 'Payment Method',
    enum: paymentMethodEnum.enumValues,
  })
  @IsEnum(paymentMethodEnum.enumValues)
  @IsOptional()
  paymentMethod: (typeof paymentMethodEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Payment amount for immediate payment' })
  @IsNumber()
  @IsOptional()
  paymentAmount?: number;

  @ApiPropertyOptional({ type: () => [AppliedAdvanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppliedAdvanceDto)
  @IsOptional()
  draftAppliedCredits?: AppliedAdvanceDto[];

  @ApiProperty({ description: 'Supplier Invoice Number' })
  @IsString()
  @IsOptional()
  supplierInvoiceNumber?: string;
}
