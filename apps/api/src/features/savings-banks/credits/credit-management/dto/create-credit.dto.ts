import { creditModalityTypeEnum, CreditStatusEnum } from '@/types/enum';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreditItem {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  agreedSellingPrice: number;

  @IsString()
  @IsOptional()
  itemDescription?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  itemId?: number;

  @IsString()
  @IsNotEmpty()
  itemType: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  saleDate: Date;

  @IsInt()
  @IsPositive()
  @IsOptional()
  days?: number;
}

export class CreateCreditDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  associateId: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  creditTypeId: number;

  @IsEnum(creditModalityTypeEnum)
  creditModality: creditModalityTypeEnum;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  requestDate: Date; // Fecha de solicitud

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date; // Fecha de inicio

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate: Date; // Fecha de culminacion

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  requestedAmount: number; // Monto solicitado

  @IsNumber()
  @IsOptional()
  overdraftAmount?: number; // Sobregiro si aplica

  @IsNumber()
  @IsPositive()
  @IsOptional()
  previousCreditId: number; // Relación con préstamo anterior si existe

  @IsEnum(CreditStatusEnum)
  @IsNotEmpty()
  status: CreditStatusEnum;

  @IsString()
  @IsOptional()
  notes?: string; // Observaciones

  @IsString()
  @IsOptional()
  invoiceNumber: string;

  @IsString()
  @IsOptional()
  commercialHouseId: string;

  @IsBoolean()
  @IsNotEmpty()
  useCommercialHouse: boolean;

  @Type(() => CreditItem)
  @IsOptional()
  creditItems?: CreditItem[];
}
