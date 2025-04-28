import { CurrencyCodeEnum, StatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';

export class UpdateAssociateAccountsDto {
  @ApiProperty({ description: 'Associated ID' })
  @IsInt()
  @IsOptional()
  associateId?: number;

  @ApiProperty({ description: 'Account number' })
  @IsOptional()
  @IsNumber()
  accountNumber?: number;

  @ApiProperty({
    description: 'Currency Code',
    enum: CurrencyCodeEnum,
    enumName: 'CurrencyCodeEnum',
  })
  @IsOptional()
  @IsEnum(CurrencyCodeEnum)
  currencyCode?: CurrencyCodeEnum;

  @ApiProperty({ description: 'Initial balance', required: false })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiProperty({ description: 'Opening date', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  openingDate?: Date;

  @ApiProperty({ description: 'Bank ID' })
  @IsInt()
  @IsOptional()
  bankDirectoryId?: number;

  @ApiProperty({ description: 'Base salary' })
  @IsInt()
  @IsOptional()
  baseSalary?: number;

  @ApiProperty({
    description: 'Account status',
    enum: StatusEnum,
    enumName: 'StatusEnum',
  })
  @IsEnum(StatusEnum)
  @IsOptional()
  status?: StatusEnum;
}
