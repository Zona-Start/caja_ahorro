import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { BcvScraperService } from './bcv-scraper.service';
import { BcvService } from './bcv.service';
import { ManualRateDto } from './dto/manual-rate.dto';

@Controller('core/exchange-rates')
export class ExchangeRatesController {
  constructor(
    private readonly bcvService: BcvService,
    private readonly bcvScraperService: BcvScraperService,
  ) {}

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.bcvService.findAll(
      pagination.page ?? 1,
      pagination.limit ?? 10,
    );
  }

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

  @Post('sync')
  async syncWithBcv() {
    try {
      const result = await this.bcvScraperService.fetchAndSaveRates();
      return {
        message: 'Tasas de cambio sincronizadas con el BCV.',
        ...result,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo sincronizar con el BCV.';
      throw new BadRequestException(
        `No se pudieron sincronizar las tasas con el BCV: ${message}`,
      );
    }
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
