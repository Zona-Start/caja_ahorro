import { ApiProperty } from '@nestjs/swagger';

export class CategoryType {
  @ApiProperty({
    description: 'The unique identifier of the category type',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The group of the category type',
    example: 'PAYROLL_TYPE',
  })
  group: string;

  @ApiProperty({
    description: 'The description of the category type',
    example: 'Quincenal',
  })
  description: string;

  @ApiProperty({
    description: 'Additional options for the category type',
    example: 1,
    nullable: true,
  })
  options?: number | null;

  @ApiProperty({
    description: 'The date when the category type was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at?: Date;

  @ApiProperty({
    description: 'The date when the category type was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at?: Date | null;
}
