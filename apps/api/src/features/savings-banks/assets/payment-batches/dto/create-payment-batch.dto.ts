import { paymentBatchItemType } from '@/types/enum';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePaymentBatchItemDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  sourceId: number;

  @IsEnum(paymentBatchItemType)
  @IsNotEmpty()
  type: paymentBatchItemType;
}

export class CreatePaymentBatchDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  bankAccountId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentBatchItemDto)
  items: CreatePaymentBatchItemDto[];
}
