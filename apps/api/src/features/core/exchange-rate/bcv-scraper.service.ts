import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { exchangeRates } from '@/database/schema';
import { SettingsService } from '@/features/core/settings/settings.service';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const SPANISH_MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

@Injectable()
export class BcvScraperService implements OnModuleInit {
  private readonly logger = new Logger(BcvScraperService.name);
  private readonly BCV_URL = 'https://www.bcv.org.ve/';

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly settingsService: SettingsService,
  ) {}

  onModuleInit() {
    this.logger.log('BCV Scraper Service initialized');
  }

  @Cron('30 18,19,20 * * 1-5')
  async syncExchangeRates() {
    const setting = await this.settingsService.getGlobal(
      'EXCHANGE_RATE_AUTO_SYNC',
    );
    if (setting?.toLowerCase() !== 'true') {
      this.logger.debug('Auto sync disabled, skipping BCV fetch');
      return;
    }

    try {
      await this.fetchAndSaveRates();
    } catch (error) {
      this.logger.error('Failed to sync exchange rates from BCV', error);
    }
  }

  async fetchAndSaveRates(): Promise<void> {
    this.logger.log('Scraping exchange rates from BCV website...');

    const html = await this.fetchHtml();
    const $ = cheerio.load(html);
    const ratesText = this.extractRatesText($);

    const rates = this.parseRates(ratesText);
    const fechaValor = this.parseFechaValor(ratesText);
    const datesToSave = this.determineDatesToSave(fechaValor);

    this.logger.log(
      `Parsed rates — USD: ${rates.USD}, EUR: ${rates.EUR}, Fecha Valor: ${fechaValor.toISOString().split('T')[0]}, saving for ${datesToSave.length} day(s)`,
    );

    const currencies = await this.db.query.currencies.findMany({
      where: (c, { inArray }) => inArray(c.code, ['USD', 'EUR']),
    });

    const usdCurrency = currencies.find((c) => c.code === 'USD');
    const eurCurrency = currencies.find((c) => c.code === 'EUR');

    if (!usdCurrency || !eurCurrency) {
      this.logger.warn('USD or EUR currency not found in database');
      return;
    }

    for (const date of datesToSave) {
      await this.insertRateIfMissing(usdCurrency.id, rates.USD, date);
      await this.insertRateIfMissing(eurCurrency.id, rates.EUR, date);
    }

    this.logger.log(
      `Exchange rates saved for ${datesToSave.length} day(s): USD=${rates.USD}, EUR=${rates.EUR}`,
    );
  }

  private async fetchHtml(): Promise<string> {
    const { data } = await axios.get<string>(this.BCV_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      timeout: 20_000,
    });
    return data;
  }

  private extractRatesText($: cheerio.CheerioAPI): string {
    const selectors = [
      '.view-dolar .field-content',
      '.views-field-field-dolar .field-content',
      '.view-bcv-indicadores .field-content',
      '.view-indicadores .field-content',
      '.contenido-dolar',
      '.bloque-dolar',
      '.view-content .field-content',
    ];

    for (const selector of selectors) {
      const el = $(selector);
      if (el.length === 0) continue;
      const text = el.text().trim().replace(/\s+/g, ' ');
      if (/USD\s+[\d.,]+/.test(text) && /EUR\s+[\d.,]+/.test(text)) {
        return text;
      }
    }

    const bodyText = $('body').text().replace(/\s+/g, ' ');
    const idx = bodyText.indexOf('Fecha Valor:');
    if (idx === -1)
      throw new Error('Could not find exchange rate text in BCV HTML');
    const start = bodyText.lastIndexOf('EUR', idx);
    if (start === -1)
      throw new Error('Could not find EUR rate before Fecha Valor');
    return bodyText.slice(start, Math.min(idx + 60, bodyText.length)).trim();
  }

  private parseRates(text: string): { USD: string; EUR: string } {
    const usdMatch = text.match(/USD\s+([\d.,]+)/);
    const eurMatch = text.match(/EUR\s+([\d.,]+)/);

    if (!usdMatch || !eurMatch) {
      throw new Error(
        `Could not parse rates from text. USD: ${!!usdMatch}, EUR: ${!!eurMatch}`,
      );
    }

    return {
      USD: usdMatch[1].replace(',', '.'),
      EUR: eurMatch[1].replace(',', '.'),
    };
  }

  private parseFechaValor(text: string): Date {
    const match = text.match(
      /Fecha Valor:\s*(\w+),\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i,
    );
    if (!match) throw new Error('Fecha Valor not found in BCV HTML');

    const [, , dayStr, monthStr, yearStr] = match;
    const month = SPANISH_MONTHS[monthStr.toLowerCase()];
    if (month === undefined) {
      throw new Error(`Unknown Spanish month: "${monthStr}"`);
    }

    const day = parseInt(dayStr, 10);
    const year = parseInt(yearStr, 10);

    return new Date(year, month, day);
  }

  private determineDatesToSave(fechaValor: Date): Date[] {
    const today = new Date();
    const todayDay = today.getDay();
    const fvDay = fechaValor.getDay();

    if (fvDay === 1 && todayDay === 5) {
      const saturday = new Date(fechaValor);
      saturday.setDate(saturday.getDate() - 2);

      const sunday = new Date(fechaValor);
      sunday.setDate(sunday.getDate() - 1);

      return [saturday, sunday, fechaValor];
    }

    return [fechaValor];
  }

  private async insertRateIfMissing(
    currencyId: string,
    rate: string,
    date: Date,
  ): Promise<void> {
    const midnight = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );

    const existing = await this.db
      .select({ id: exchangeRates.id })
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.currencyId, currencyId),
          eq(exchangeRates.fetchedAt, midnight),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      this.logger.debug(
        `Rate already exists for currency ${currencyId} on ${midnight.toISOString().split('T')[0]}, skipping`,
      );
      return;
    }

    await this.db.insert(exchangeRates).values({
      currencyId,
      rate,
      source: 'BCV',
      isAutomatic: true,
      fetchedAt: midnight,
    });
  }
}
