import { ApiProperty } from '@nestjs/swagger';

export class BankDirectory {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  countryCode?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: string;

  @ApiProperty({ required: false })
  updatedById?: string;
}
