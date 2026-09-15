import * as cheerio from 'cheerio';
import { BcvScraperService } from './bcv-scraper.service';

const RATES_TEXT =
  'EUR 947,29802151 CNY 121,40899810 TRY 16,82279186 RUB 9,46195951 USD 814,69080000 Fecha Valor: Martes, 08 Septiembre 2026';

describe('BcvScraperService', () => {
  let service: any;

  beforeEach(() => {
    service = new BcvScraperService(
      {} as any,
      { getGlobal: jest.fn() } as any,
      { get: jest.fn() } as any,
    );
  });

  describe('parseRates', () => {
    it('extrae USD y EUR desde el texto del BCV', () => {
      const rates = service.parseRates(RATES_TEXT);
      expect(rates.USD).toBe('814.69080000');
      expect(rates.EUR).toBe('947.29802151');
    });

    it('lanza error si falta una moneda', () => {
      expect(() =>
        service.parseRates(
          'USD 814,69080000 Fecha Valor: Martes, 08 Septiembre 2026',
        ),
      ).toThrow();
    });
  });

  describe('parseFechaValor', () => {
    it('parsea la fecha valor en español desde el HTML', () => {
      const html = `<html><body>${RATES_TEXT}</body></html>`;
      const $ = cheerio.load(html);
      const fecha = service.parseFechaValor($);
      expect(fecha.getFullYear()).toBe(2026);
      expect(fecha.getMonth()).toBe(8); // septiembre
      expect(fecha.getDate()).toBe(8);
    });
  });

  describe('determineDatesToSave', () => {
    it('retorna solo el fecha valor en un día hábil normal', () => {
      const fechaValor = new Date(2026, 8, 8); // martes
      const dates = service.determineDatesToSave(fechaValor);
      expect(dates.length).toBe(1);
    });
  });

  describe('extractRatesText', () => {
    it('encuentra las tasas con el selector de fallback', () => {
      const html = `
        <html><body>
          <div class="view-content">
            <div class="field-content">EUR 947,29802151</div>
            <div class="field-content">USD 814,69080000</div>
            <div class="field-content">Fecha Valor: Martes, 08 Septiembre 2026</div>
          </div>
        </body></html>`;
      const $ = cheerio.load(html);
      const text = service.extractRatesText($);
      expect(text).toContain('EUR 947,29802151');
      expect(text).toContain('USD 814,69080000');
    });
  });
});
