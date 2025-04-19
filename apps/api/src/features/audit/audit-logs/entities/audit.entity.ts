import { ApiProperty } from '@nestjs/swagger';
import { Action } from '../dto/audit-logs-enum';

export class Audit {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tableName: string;

  @ApiProperty()
  recordId: string;

  @ApiProperty()
  action: Action;

  @ApiProperty({ required: false })
  userId?: number | null;

  @ApiProperty()
  area: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  timestamp?: Date | null;

  @ApiProperty({ required: false })
  previousData?: JSON | null;

  @ApiProperty({ required: false })
  newData?: JSON | null;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date | null;
}
