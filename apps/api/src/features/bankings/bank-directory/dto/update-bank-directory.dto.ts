import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateBankDirectoryDto } from './create-bank-directory.dto';

export class UpdateBankDirectoryDto extends PartialType(
  CreateBankDirectoryDto,
) {
  @IsOptional()
  @IsString()
  @MaxLength(3)
  countryCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: string;
}
