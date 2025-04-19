import { PartialType } from '@nestjs/swagger';
import { CreateCurrenciesDto } from './create-currencies.dto';

export class UpdateCurrenciesDto extends PartialType(CreateCurrenciesDto) {}
