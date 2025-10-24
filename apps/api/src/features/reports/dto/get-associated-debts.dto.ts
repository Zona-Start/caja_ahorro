import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';

export class GetAssociatedDebtsDto {
  @ApiProperty({
    description: 'The start date for the report range',
    example: '2025-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({
    description: 'The end date for the report range',
    example: '2025-12-31',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;
}
