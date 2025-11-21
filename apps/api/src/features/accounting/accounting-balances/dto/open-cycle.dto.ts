import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class OpenCycleDto {
  @ApiProperty({
    description: 'ID of the existing cycle to be opened (Target Cycle)',
  })
  @IsInt()
  @IsNotEmpty()
  targetCycleId: number;
}
