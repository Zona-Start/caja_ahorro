import { ActionEnumAudit } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class ActivityLogsSystem {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  userId?: number | null;

  @ApiProperty({ type: () => ActionEnumAudit })
  type: ActionEnumAudit;
  description: string;

  @ApiProperty({ required: false })
  timestamp?: Date | null;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date | null;
}
