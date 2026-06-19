import { Controller, Get, Param } from '@nestjs/common';
import { BcvService } from './bcv.service';

@Controller('core/exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly bcvService: BcvService) {}

  @Get('latest/:currencyCode')
  async getLatestRate(@Param('currencyCode') currencyCode: string) {
    const rate = await this.bcvService.getLatestRate(currencyCode.toUpperCase() as 'USD' | 'EUR');
    if (!rate) {
      return { rate: null, fetchedAt: null };
    }
    return rate;
  }
}
