import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBankDirectoryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(5)
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}
