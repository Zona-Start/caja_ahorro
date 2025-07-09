import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSalesProductPurchaseDto {
  @ApiProperty({ description: 'Product ID' })
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: 'Purchase date' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  purchaseDate: Date;

  @ApiProperty({ description: 'Quantity of products purchased' })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit cost of the product' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNotEmpty()
  @Min(0)
  unitCost: number;

  @ApiProperty({ description: 'Total cost of the purchase' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsNotEmpty()
  @Min(0)
  totalCost: number;

  @ApiProperty({ description: 'Supplier name', required: false })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiProperty({ description: 'Invoice reference', required: false })
  @IsOptional()
  @IsString()
  invoiceReference?: string;

  @ApiProperty({ description: 'Bank transaction ID', required: false })
  @IsOptional()
  @IsInt()
  bankTransactionId?: number;
}