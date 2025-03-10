import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBankDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(5)
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}