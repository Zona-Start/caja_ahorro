import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class LinkToInternalRecordDto {
  @ApiProperty({
    description: 'The type of the internal record to link.',
    example: 'LOAN_PAYMENT',
  })
  @IsString()
  @IsNotEmpty()
  internalRecordType: string;

  @ApiProperty({
    description: 'The ID of the internal record to link.',
    example: 123,
  })
  @IsInt()
  @IsNotEmpty()
  internalRecordId: number;
}
