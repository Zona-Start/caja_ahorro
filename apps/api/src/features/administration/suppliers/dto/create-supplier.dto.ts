import { categorySuppliers, StatusEnum, statusSuppliers } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ description: 'ID de la compañía', required: false })
  @IsNumber()
  @IsOptional()
  companyId?: number;

  @ApiProperty({ description: 'Código del proveedor', example: 'PROV001' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'Nombre del proveedor',
    example: 'Suministros S.A.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Identificación fiscal (RIF, RUC, NIT)',
    example: 'J-12345678-9',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  taxId: string;

  @ApiProperty({
    description: 'Nombre de la persona de contacto',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  contactName?: string;

  @ApiProperty({ description: 'Email de contacto', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  contactEmail?: string;

  @ApiProperty({ description: 'Teléfono de contacto', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @ApiProperty({ description: 'ID del estado/provincia', required: false })
  @IsNumber()
  @IsOptional()
  state?: number;

  @ApiProperty({ description: 'Dirección del proveedor', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Categoría del proveedor',
    enum: categorySuppliers,
    example: categorySuppliers.PRODUCTS,
  })
  @IsEnum(categorySuppliers)
  @IsNotEmpty()
  category: categorySuppliers;

  @ApiProperty({
    description: 'Estado del proveedor',
    enum: statusSuppliers,
    example: StatusEnum.ACTIVE,
    required: false,
  })
  @IsEnum(statusSuppliers)
  @IsOptional()
  status?: statusSuppliers;
}
