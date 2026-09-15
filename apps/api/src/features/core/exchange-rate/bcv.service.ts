import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { exchangeRates } from '@/database/schema';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class BcvService implements OnModuleInit {
  private readonly logger = new Logger(BcvService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  onModuleInit() {
    this.logger.log('BCV Service initialized');
  }

  /**
   * Devuelve la tasa de cambio de una moneda para una fecha concreta (día hábil).
   * Si no existe exactamente en esa fecha, cae a la más reciente con rate_date <= date.
   * Es la fuente única para congelar la tasa histórica de una transacción.
   */
  async getRateAt(
    currencyCode: 'USD' | 'EUR' | 'VES',
    date: Date | string,
  ): Promise<{ rate: string; rateDate: string } | null> {
    if (currencyCode === 'VES') {
      return { rate: '1', rateDate: this.toDateString(date) };
    }

    const dateStr = this.toDateString(date);
    const currency = await this.db.query.currencies.findFirst({
      where: (c, { eq }) => eq(c.code, currencyCode),
    });
    if (!currency) return null;

    const rate = await this.db.query.exchangeRates.findFirst({
      where: (r, { eq, lte }) =>
        and(eq(r.currencyId, currency.id), lte(r.rateDate, dateStr)),
      orderBy: (r, { desc }) => [desc(r.rateDate)],
    });

    if (!rate) return null;

    return { rate: String(rate.rate), rateDate: String(rate.rateDate) };
  }

  async getLatestRate(
    currencyCode: 'USD' | 'EUR',
  ): Promise<{ rate: string; rateDate: string } | null> {
    const currency = await this.db.query.currencies.findFirst({
      where: (c, { eq }) => eq(c.code, currencyCode),
    });
    if (!currency) return null;

    const rate = await this.db.query.exchangeRates.findFirst({
      where: (r, { eq }) => eq(r.currencyId, currency.id),
      orderBy: (r, { desc }) => [desc(r.rateDate)],
    });

    if (!rate) return null;

    return { rate: String(rate.rate), rateDate: String(rate.rateDate) };
  }

  /** Tasa vigente para el día de hoy (con fallback a la más reciente <= hoy). */
  async getTodayRate(): Promise<string | null> {
    const rate = await this.getRateAt('USD', new Date());
    return rate?.rate ?? null;
  }

  /** Fija manualmente la tasa del día (upsert por moneda y rate_date). */
  async setRateManual(
    rate: string,
    userId: string,
    rateDate?: Date | string,
    currencyCode: 'USD' | 'EUR' = 'USD',
  ): Promise<{ id: string; rate: string; rateDate: string }> {
    const currency = await this.db.query.currencies.findFirst({
      where: (c, { eq }) => eq(c.code, currencyCode),
    });

    if (!currency) {
      throw new Error(`${currencyCode} currency not found`);
    }

    const dateStr = this.toDateString(rateDate ?? new Date());

    const [result] = await this.db
      .insert(exchangeRates)
      .values({
        currencyId: currency.id,
        rate,
        rateDate: dateStr,
        source: 'MANUAL',
        isAutomatic: false,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [exchangeRates.currencyId, exchangeRates.rateDate],
        set: {
          rate,
          source: 'MANUAL',
          isAutomatic: false,
          fetchedAt: new Date(),
        },
      })
      .returning({
        id: exchangeRates.id,
        rate: exchangeRates.rate,
        rateDate: exchangeRates.rateDate,
      });

    this.logger.log(
      `Manual exchange rate set: 1 ${currencyCode} = ${rate} VES (${dateStr}) by user ${userId}`,
    );

    return result;
  }

  private toDateString(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
