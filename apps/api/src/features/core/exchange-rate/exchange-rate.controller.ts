import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BcvService } from './bcv.service';
import { ManualRateDto } from './dto/manual-rate.dto';

@Controller('core/exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly bcvService: BcvService) {}

  @Get('latest/:currencyCode')
  async getLatestRate(@Param('currencyCode') currencyCode: string) {
    const rate = await this.bcvService.getLatestRate(
      currencyCode.toUpperCase() as 'USD' | 'EUR',
    );
    if (!rate) {
      return { rate: null, rateDate: null };
    }
    return rate;
  }

  @Post('manual')
  async setManualRate(@Body() body: ManualRateDto) {
    const rate = await this.bcvService.setRateManual(
      String(body.rate),
      'SYSTEM',
      body.rateDate ?? new Date(),
      body.currencyCode,
    );
    return {
      message: 'Tasa de cambio fijada manualmente.',
      currencyCode: body.currencyCode,
      ...rate,
    };
  }
}
