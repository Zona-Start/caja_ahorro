import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { CurrencyCodeEnum } from '@/types/enum';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BcvService } from './bcv.service';

export interface AmountSplit {
  amountBase: number;
  amountForeign: number;
  exchangeRate: number;
}

@Injectable()
export class ExchangeRateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly bcvService: BcvService,
  ) {}

  /**
   * Resuelve la moneda base del tenant.
   * 1) Setting de módulo `MONEDA` (1=VES, 2=USD) si existe para el tenant.
   * 2) Fallback a la moneda marcada como is_base en la tabla currencies.
   * 3) Último recurso: VES.
   */
  async getBaseCurrency(tenantId?: string): Promise<CurrencyCodeEnum> {
    if (tenantId) {
      const setting = await this.db.query.moduleSettings.findFirst({
        where: (s, { and, eq }) =>
          and(eq(s.tenantId, tenantId), eq(s.key, 'MONEDA')),
      });
      if (setting?.value === '2') return CurrencyCodeEnum.USD;
      if (setting?.value === '1') return CurrencyCodeEnum.VES;
    }

    const base = await this.db.query.currencies.findFirst({
      where: (c, { eq }) => eq(c.isBase, true),
    });
    if (base) return base.code as CurrencyCodeEnum;

    return CurrencyCodeEnum.VES;
  }

  /**
   * Obtiene la tasa congelada para una moneda y fecha (día hábil).
   * Si la moneda es la base, la tasa es 1.
   */
  async getRate(
    tenantId: string,
    date: Date | string,
    currencyCode: CurrencyCodeEnum,
  ): Promise<number> {
    const baseCurrency = await this.getBaseCurrency(tenantId);
    if (currencyCode === baseCurrency) return 1;

    const rate = await this.bcvService.getRateAt(
      currencyCode as 'USD' | 'EUR',
      date,
    );
    if (!rate) {
      throw new Error(
        `No se encontró tasa de cambio para ${currencyCode} en la fecha ${date}.`,
      );
    }
    return Number(rate.rate);
  }

  /**
   * Desglosa un importe en moneda base y extranjera según la tasa congelada.
   * Si currencyCode es la moneda base => amountForeign = 0.
   * Si currencyCode es extranjera => amountBase = amount * rate, amountForeign = amount.
   */
  async splitAmount(
    tenantId: string,
    date: Date | string,
    amount: number,
    currencyCode: CurrencyCodeEnum,
  ): Promise<AmountSplit> {
    const baseCurrency = await this.getBaseCurrency(tenantId);
    const exchangeRate = await this.getRate(tenantId, date, currencyCode);

    if (currencyCode === baseCurrency) {
      return {
        amountBase: this.round(amount),
        amountForeign: 0,
        exchangeRate,
      };
    }

    return {
      amountBase: this.round(amount * exchangeRate),
      amountForeign: this.round(amount),
      exchangeRate,
    };
  }

  /** Redondeo a 4 decimales (precisión de importes base/foreign). */
  round(value: number): number {
    return Math.round((value + Number.EPSILON) * 10000) / 10000;
  }
}
