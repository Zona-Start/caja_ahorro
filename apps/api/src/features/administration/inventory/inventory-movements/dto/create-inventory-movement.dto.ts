import { movementTypeInventory } from '@/database/schema/enum/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class InventoryMovementItemDto {
  @ApiProperty({ description: 'Item ID (Product or Fixed Asset)' })
  @IsInt()
  @IsNotEmpty()
  itemId: number;

  @ApiProperty({ description: 'Item type', enum: ['PRODUCT', 'FIXED_ASSET'] })
  @IsIn(['PRODUCT', 'FIXED_ASSET'])
  @IsString()
  @IsNotEmpty()
  itemType: 'PRODUCT' | 'FIXED_ASSET';

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  unitCost?: number;
}

export class CreateInventoryMovementDto {
  @ApiProperty({
    description: 'Movement type',
    enum: movementTypeInventory.enumValues,
  })
  @IsEnum(movementTypeInventory.enumValues)
  @IsNotEmpty()
  movementType: (typeof movementTypeInventory.enumValues)[number];

  @ApiPropertyOptional({ description: 'Short description of the movement' }) // New field
  @IsString()
  @MaxLength(255) // New validator
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Document type' })
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional({ description: 'Document number' })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: () => [InventoryMovementItemDto] })
  @ValidateNested({ each: true })
  @Type(() => InventoryMovementItemDto)
  @IsArray()
  items: InventoryMovementItemDto[];

  @ApiPropertyOptional({ description: 'Supplier Invoice Id' })
  @IsInt()
  @IsOptional()
  supplierInvoiceId?: number;
}
