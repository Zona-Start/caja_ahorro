import { ApiProperty } from '@nestjs/swagger';

export class Municipality {
  @ApiProperty({
    description: 'The unique identifier of the municipality',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The name of the municipality',
    example: 'Los Angeles',
  })
  name: string;

  @ApiProperty({
    description: 'The ID of the state this municipality belongs to',
    example: 1,
  })
  stateId: number;

  @ApiProperty({
    description: 'The name of the state this municipality belongs to',
    example: 'California',
  })
  stateName?: string | null;

  @ApiProperty({
    description: 'The date when the municipality was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at?: Date | null;

  @ApiProperty({
    description: 'The date when the municipality was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at?: Date | null;
}
