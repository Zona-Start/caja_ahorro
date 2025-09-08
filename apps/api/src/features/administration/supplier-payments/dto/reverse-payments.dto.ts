
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class ReversePaymentsDto {
  @ApiProperty({
    description: 'Array of payment IDs to be reversed',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsInt({ each: true })
  paymentIds: number[];
}
