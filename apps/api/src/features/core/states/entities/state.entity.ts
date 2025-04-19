import { ApiProperty } from '@nestjs/swagger';

export class State {
  @ApiProperty({
    description: 'The unique identifier of the state',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The name of the state',
    example: 'California',
  })
  name: string;

  @ApiProperty({
    description: 'The date when the state was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at?: Date | null;

  @ApiProperty({
    description: 'The date when the state was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at?: Date | null;
}
