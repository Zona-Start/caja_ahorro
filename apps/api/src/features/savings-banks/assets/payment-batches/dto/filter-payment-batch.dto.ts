import { PaginationDto } from '@/common/dto/pagination.dto';
import { paymentBatchStatus } from '@/types/enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class FilterPaymentBatchDto extends PaginationDto {
  @ApiPropertyOptional({ enum: paymentBatchStatus })
  @IsEnum(paymentBatchStatus)
  @IsOptional()
  status?: paymentBatchStatus;
}
