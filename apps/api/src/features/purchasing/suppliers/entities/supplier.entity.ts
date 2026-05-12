import { categorySuppliers, statusSuppliers } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class Supplier {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  taxId: string;

  @ApiProperty({ required: false })
  contactName?: string | null;

  @ApiProperty({ required: false })
  contactEmail?: string | null;

  @ApiProperty({ required: false })
  contactPhone?: string | null;

  @ApiProperty({ required: false })
  state?: number | null;

  @ApiProperty({ required: false })
  address?: string | null;

  @ApiProperty({ enum: categorySuppliers, enumName: 'CategorySuppliersEnum' })
  category: categorySuppliers;

  @ApiProperty({ enum: statusSuppliers, enumName: 'StatusEnum' })
  status: statusSuppliers;

  @ApiProperty({ required: false })
  createdAt?: Date | null;

  @ApiProperty({ required: false })
  updatedAt?: Date | null;

  @ApiProperty({ required: false })
  createdById?: string | null;

  @ApiProperty({ required: false })
  updatedById?: string | null;
}
