import { ApiProperty } from '@nestjs/swagger';

export class CompanyEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  rif: string;

  @ApiProperty({ required: false })
  address?: string | null;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({ required: false })
  email?: string | null;

  @ApiProperty({ required: false })
  contactPerson?: string | null;

  @ApiProperty({ required: false })
  contactPhone?: string | null;

  @ApiProperty({ required: false })
  contactEmail?: string | null;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;
}
