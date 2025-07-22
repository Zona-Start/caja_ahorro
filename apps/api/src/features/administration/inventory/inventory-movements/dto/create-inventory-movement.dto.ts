import { movementTypeInventory } from '@/database/schema/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInventoryMovementDto {
  @ApiProperty({ description: 'Product ID' })
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: 'Movement type', enum: movementTypeInventory.enumValues })
  @IsEnum(movementTypeInventory.enumValues)
  @IsNotEmpty()
  movementType: (typeof movementTypeInventory.enumValues)[number];

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  unitCost?: number;

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
}
