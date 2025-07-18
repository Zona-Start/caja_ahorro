import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInventoryCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  group: string;

  @IsString()
  @IsOptional()
  description?: string;
}
