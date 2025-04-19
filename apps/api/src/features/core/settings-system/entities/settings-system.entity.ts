import { ApiProperty } from '@nestjs/swagger';

export class SettingSystem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;

  @ApiProperty({ required: false })
  description?: string | null;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date | null;

  @ApiProperty({ required: false })
  createdById?: number | null;

  @ApiProperty({ required: false })
  updatedById?: number | null;
}
