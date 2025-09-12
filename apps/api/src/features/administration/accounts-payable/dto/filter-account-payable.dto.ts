import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterAccountPayableDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Supplier Invoice ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  supplierInvoiceId?: number;

  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional()
  @IsString({ each: true })
  status?: string | string[] | undefined; // Should be payment status enum

  @ApiPropertyOptional({ description: 'Authorize Payment' })
  @IsOptional()
  @IsString()
  isAuthorizePayment?: string;
}
