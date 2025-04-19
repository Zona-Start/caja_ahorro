import { ApiProperty } from '@nestjs/swagger';

export class Parish {
  @ApiProperty({
    description: 'The unique identifier of the parish',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The name of the parish',
    example: 'Downtown',
  })
  name: string;

  @ApiProperty({
    description: 'The ID of the municipality this parish belongs to',
    example: 1,
  })
  municipalityId: number;

  @ApiProperty({
    description: 'The name of the municipality this parish belongs to',
    example: 'Los Angeles',
  })
  municipalityName?: string | null;

  @ApiProperty({
    description: 'The date when the parish was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at?: Date | null;

  @ApiProperty({
    description: 'The date when the parish was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at?: Date | null;
}
