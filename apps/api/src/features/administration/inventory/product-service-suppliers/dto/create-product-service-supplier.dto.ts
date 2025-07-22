import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProductServiceSupplierDto {
  @ApiPropertyOptional({ description: 'Product ID' })
  @IsInt()
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({ description: 'Service ID' })
  @IsInt()
  @IsOptional()
  serviceId?: number;

  @ApiProperty({ description: 'Supplier ID' })
  @IsInt()
  @IsNotEmpty()
  suppliersId: number;

  @ApiPropertyOptional({ description: 'Lead time in days', default: 0 })
  @IsInt()
  @IsOptional()
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Preferred supplier', default: false })
  @IsBoolean()
  @IsOptional()
  preferred?: boolean;
}
