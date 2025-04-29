import { GenderEnum, NationalityEnum, StatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class Associates {
  @ApiProperty()
  id: number;

  @ApiProperty({ required: false })
  companyId?: number;

  @ApiProperty()
  cedula: string;

  @ApiProperty()
  fullname: string;

  @ApiProperty({ type: () => NationalityEnum })
  nationality: NationalityEnum;

  @ApiProperty({ type: () => GenderEnum })
  gender: GenderEnum;

  @ApiProperty()
  birthdate!: Date;

  @ApiProperty()
  dateAdmission: Date;

  @ApiProperty({ required: false })
  dateGraduation?: Date;

  @ApiProperty({ required: false })
  discountFrequencyId?: number;

  @ApiProperty({ type: () => StatusEnum })
  status: StatusEnum;

  @ApiProperty()
  isPayrollCredit: boolean;

  @ApiProperty()
  localityId: number;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  payrollTypeId?: number;

  @ApiProperty({ required: false })
  associatedTypeId?: number;

  @ApiProperty({ required: false })
  jobTitle?: string;

  @ApiProperty({ required: false })
  baseSalary: number;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updateById?: number;
}
