import { CurrencyCodeEnum } from '@/types/enum';
import { ExchangeRateService } from './exchange-rate.service';

describe('ExchangeRateService', () => {
  let service: any;
  const bcvMock = {
    getRateAt: jest.fn(),
  };

  beforeEach(() => {
    service = new ExchangeRateService({} as any, bcvMock as any);
  });

  describe('round', () => {
    it('redondea a 4 decimales', () => {
      expect(service.round(1.23456789)).toBe(1.2346);
      expect(service.round(2.3456789)).toBe(2.3457);
    });
  });

  describe('splitAmount', () => {
    it('si la moneda es la base, amountForeign = 0 y amountBase = amount', async () => {
      service.getBaseCurrency = jest
        .fn()
        .mockResolvedValue(CurrencyCodeEnum.VES);
      service.getRate = jest.fn().mockResolvedValue(1);

      const split = await service.splitAmount(
        'tenant',
        new Date('2026-09-08'),
        1000,
        CurrencyCodeEnum.VES,
      );
      expect(split.amountBase).toBe(1000);
      expect(split.amountForeign).toBe(0);
      expect(split.exchangeRate).toBe(1);
    });

    it('si la moneda es extranjera, amountBase = amount * rate', async () => {
      service.getBaseCurrency = jest
        .fn()
        .mockResolvedValue(CurrencyCodeEnum.VES);
      service.getRate = jest.fn().mockResolvedValue(50);

      const split = await service.splitAmount(
        'tenant',
        new Date('2026-09-08'),
        100,
        CurrencyCodeEnum.USD,
      );
      expect(split.amountBase).toBe(5000);
      expect(split.amountForeign).toBe(100);
      expect(split.exchangeRate).toBe(50);
    });
  });
});
