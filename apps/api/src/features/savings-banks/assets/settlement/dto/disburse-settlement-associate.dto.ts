import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisburseSettlementAssociateDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria desde donde se realizará el pago' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  bankAccountId: number;

  @ApiProperty({ description: 'Referencia bancaria de la transferencia' })
  @IsString()
  @IsNotEmpty()
  bankReference: string;

  @ApiProperty({ description: 'Fecha en la que se realizó la transferencia' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  transferDate: Date;
}
