import {
  IsDateString,
  IsInt,
  IsNumberString,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFixedAssetsMaintenanceDto {
  @IsInt()
  assetId: number;

  @IsDateString()
  maintenanceDate: Date;

  @IsString()
  @MaxLength(100)
  maintenanceType: string;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumberString()
  cost: string;

  @IsString()
  @MaxLength(100)
  performedBy: string;
}
