import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { exchangeRates } from '@/database/schema';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class BcvService implements OnModuleInit {
  private readonly logger = new Logger(BcvService.name);
  private readonly BCV_URL = 'https://www.bcv.org.ve/';

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly configService: ConfigService,
  ) { }

  onModuleInit() {
    this.logger.log('BCV Service initialized');
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async syncExchangeRates() {
    const autoSync = this.configService.get<boolean>('exchange_rate_auto_sync');

    if (!autoSync) {
      this.logger.debug('Auto sync disabled, skipping BCV fetch');
      return;
    }

    try {
      await this.fetchAndSaveRates();
    } catch (error) {
      this.logger.error('Failed to sync exchange rates from BCV', error);
    }
  }

  async fetchAndSaveRates() {
    this.logger.log('Fetching exchange rates from BCV...');

    try {
      const response = await fetch(this.BCV_URL, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`BCV returned ${response.status}`);
      }

      const data = await response.json();

      const usdRate = this.extractUSDRate(data);

      const currency = await this.db.query.currencies.findFirst({
        where: (c, { eq }) => eq(c.code, 'USD'),
      });

      if (!currency) {
        this.logger.warn('USD currency not found in database');
        return;
      }

      await this.db.insert(exchangeRates).values({
        currencyId: currency.id,
        rate: usdRate,
        source: 'BCV',
        isAutomatic: true,
        fetchedAt: new Date(),
      });

      this.logger.log(`Exchange rate saved: 1 USD = ${usdRate} VES`);
    } catch (error) {
      this.logger.error('Error fetching BCV rates', error);
      throw error;
    }
  }

  private extractUSDRate(data: any): string {
    try {
      if (data.dolar) {
        return data.dolar.replace(',', '.');
      }
      if (data?.result?.[0]?.dolares) {
        return data.result[0].dolares.replace(',', '.');
      }
      return '1';
    } catch {
      return '1';
    }
  }

  async getLatestRate(
    currencyCode: 'USD' | 'EUR',
  ): Promise<{ rate: string; fetchedAt: Date } | null> {
    const currency = await this.db.query.currencies.findFirst({
      where: (c, { eq }) => eq(c.code, currencyCode),
    });
    if (!currency) return null;

    const rate = await this.db.query.exchangeRates.findFirst({
      where: (r, { eq }) => eq(r.currencyId, currency.id),
      orderBy: (r, { desc }) => [desc(r.fetchedAt)],
    });

    if (!rate) return null;

    return { rate: rate.rate, fetchedAt: rate.fetchedAt! };
  }

  async getTodayRate(): Promise<string | null> {
    const currency = await this.db.query.currencies.findFirst({
      where: (c, { eq }) => eq(c.code, 'USD'),
    });

    if (!currency) return null;

    const rate = await this.db.query.exchangeRates.findFirst({
      where: (r, { eq, and, gte, lte }) =>
        and(
          eq(r.currencyId, currency.id),
          gte(r.fetchedAt, new Date(new Date().setHours(0, 0, 0, 0))),
          lte(r.fetchedAt, new Date(new Date().setHours(23, 59, 59, 999))),
        ),
      orderBy: (r, { desc }) => [desc(r.fetchedAt)],
    });

    return rate?.rate || null;
  }

  async setRateManual(rate: string, userId: string) {
    const currency = await this.db.query.currencies.findFirst({
      where: (c, { eq }) => eq(c.code, 'USD'),
    });

    if (!currency) {
      throw new Error('USD currency not found');
    }

    const result = await this.db.insert(exchangeRates).values({
      currencyId: currency.id,
      rate,
      source: 'MANUAL',
      isAutomatic: false,
      fetchedAt: new Date(),
    });

    this.logger.log(
      `Manual exchange rate set: 1 USD = ${rate} VES by user ${userId}`,
    );

    return result;
  }
}
