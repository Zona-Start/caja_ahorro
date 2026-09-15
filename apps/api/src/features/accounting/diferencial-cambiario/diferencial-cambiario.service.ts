import * as schema from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { ExchangeRateService } from '@/features/core/exchange-rate/exchange-rate.service';
import { CurrencyCodeEnum } from '@/types/enum';
import { BadRequestException, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface DiferencialCambiarioParams {
  tenantId: string;
  userId: string;
  currencyCode: CurrencyCodeEnum; // Moneda extranjera de la operación
  foreignAmount: number; // Importe en moneda extranjera
  accrualDate: Date; // Fecha de causación/facturación
  settlementDate: Date; // Fecha de cobro/pago
  fxDifferenceAccountId: string; // Cuenta de resultado por diferencia cambiaria
  counterpartyAccountId: string; // Cuenta contrapartida (caja/banco/cuentas por cobrar)
  description?: string;
  tx?: NodePgDatabase<typeof schema>;
}

@Injectable()
export class DiferencialCambiarioService {
  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  /**
   * Registra el asiento de diferencial cambiario entre la fecha de causación y
   * la fecha de cobro/pago, congelando ambas tasas históricas.
   */
  async register(params: DiferencialCambiarioParams) {
    const {
      tenantId,
      userId,
      currencyCode,
      foreignAmount,
      accrualDate,
      settlementDate,
      fxDifferenceAccountId,
      counterpartyAccountId,
      description,
      tx,
    } = params;

    const baseCurrency =
      await this.exchangeRateService.getBaseCurrency(tenantId);
    if (currencyCode === baseCurrency) {
      throw new BadRequestException(
        'No aplica diferencial cambiario en moneda base.',
      );
    }

    const rateAccrual = await this.exchangeRateService.getRate(
      tenantId,
      accrualDate,
      currencyCode,
    );
    const rateSettlement = await this.exchangeRateService.getRate(
      tenantId,
      settlementDate,
      currencyCode,
    );

    const baseAccrual = this.exchangeRateService.round(
      foreignAmount * rateAccrual,
    );
    const baseSettlement = this.exchangeRateService.round(
      foreignAmount * rateSettlement,
    );
    const difference = this.exchangeRateService.round(
      baseSettlement - baseAccrual,
    );

    if (Math.abs(difference) < 0.0001) {
      return { registered: false, difference: 0, message: 'Sin variación.' };
    }

    // Ganancia cambiaria (diferencia > 0) o pérdida (diferencia < 0).
    const isGain = difference > 0;
    const amount = Math.abs(difference);

    const details = [
      {
        accountPlanId: isGain ? fxDifferenceAccountId : counterpartyAccountId,
        debit: isGain ? '0.00' : amount.toFixed(4),
        credit: isGain ? amount.toFixed(4) : '0.00',
      },
      {
        accountPlanId: isGain ? counterpartyAccountId : fxDifferenceAccountId,
        debit: isGain ? amount.toFixed(4) : '0.00',
        credit: isGain ? '0.00' : amount.toFixed(4),
      },
    ];

    const entry = await this.accountingEntriesService.create(
      userId,
      tenantId,
      {
        entryDate: settlementDate,
        description:
          description ??
          `Diferencial cambiario ${currencyCode} (${isGain ? 'ganancia' : 'pérdida'})`,
        originType: 'EXCHANGE_RATE_DIFFERENCE',
        currencyCode: baseCurrency,
        exchangeRate: 1,
        details: details.map((d) => ({
          accountPlanId: d.accountPlanId,
          debit: d.debit,
          credit: d.credit,
          currencyCode: baseCurrency,
        })) as any,
      },
      tx,
    );

    return {
      registered: true,
      difference,
      isGain,
      rateAccrual,
      rateSettlement,
      entryId: entry.id,
    };
  }
}
