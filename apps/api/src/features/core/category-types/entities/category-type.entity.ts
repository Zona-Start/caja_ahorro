import { ApiProperty } from '@nestjs/swagger';

export class CategoryType {
  @ApiProperty()
  id: number;

  @ApiProperty()
  group: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  options?: JSON | null;

  @ApiProperty({ required: false })
  created_at?: Date | null;

  @ApiProperty({ required: false })
  updated_at?: Date | null;
}
