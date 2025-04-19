import { PartialType } from '@nestjs/swagger';
import { CreateExchangeRatesDto } from './create-exchange-rates.dto';

export class UpdateExchangeRatesDto extends PartialType(
  CreateExchangeRatesDto,
) {}
