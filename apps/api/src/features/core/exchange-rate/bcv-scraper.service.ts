import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { exchangeRates } from '@/database/schema';
import { SettingsService } from '@/features/core/settings/settings.service';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as https from 'https';

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

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

@Injectable()
export class BcvScraperService implements OnModuleInit {
  private readonly logger = new Logger(BcvScraperService.name);
  private readonly BCV_URL = 'https://www.bcv.org.ve/';

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('BCV Scraper Service initialized');
    await this.ensureTodayRates();
  }

  /**
   * Al arrancar la aplicación, valida si ya existe la tasa de cambio del día
   * (día hábil esperado). Si no existe, ejecuta la sincronización de inmediato.
   */
  private async ensureTodayRates(): Promise<void> {
    const setting = await this.settingsService.getGlobal(
      'EXCHANGE_RATE_AUTO_SYNC',
    );
    if (setting?.toLowerCase() !== 'true') {
      this.logger.debug(
        'Auto sync disabled, skipping startup exchange-rate check',
      );
      return;
    }

    try {
      const expectedDate = this.expectedRateDate();
      const latest = await this.db.query.exchangeRates.findFirst({
        orderBy: (r, { desc }) => [desc(r.rateDate)],
      });

      const latestDate = latest?.rateDate
        ? this.toDateString(new Date(String(latest.rateDate)))
        : null;

      if (latestDate && latestDate >= expectedDate) {
        this.logger.log(
          `Tasa de cambio al día (${latestDate}). No se requiere sync al arrancar.`,
        );
        return;
      }

      this.logger.log(
        `Sin tasa de cambio vigente para ${expectedDate} (última: ${latestDate ?? 'ninguna'}). Ejecutando sync inmediato...`,
      );
      await this.fetchAndSaveRates();
    } catch (error) {
      this.logger.warn(
        `No se pudo sincronizar la tasa de cambio al arrancar; se reintentará en el cron programado. Detalle: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Fecha de día hábil esperada (viernes si hoy es sábado/domingo). */
  private expectedRateDate(): string {
    const d = new Date();
    const dow = d.getDay(); // 0=domingo ... 6=sábado
    if (dow === 0) d.setDate(d.getDate() - 2);
    else if (dow === 6) d.setDate(d.getDate() - 1);
    return this.toDateString(d);
  }

  // Consulta diaria a las 07:00 (todos los días) y reintento a las 12:00.
  @Cron('0 7 * * *')
  async syncExchangeRatesMorning() {
    await this.syncExchangeRates();
  }

  @Cron('0 12 * * *')
  async syncExchangeRatesNoon() {
    await this.syncExchangeRates();
  }

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
      this.logger.error(
        'Failed to sync exchange rates from BCV',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async fetchAndSaveRates(): Promise<void> {
    this.logger.log('Scraping exchange rates from BCV website...');

    const html = await this.fetchHtml();
    const $ = cheerio.load(html);
    const ratesText = this.extractRatesText($);

    const rates = this.parseRates(ratesText);
    const fechaValor = this.parseFechaValor($);
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
    const allowInsecure =
      this.configService.get<boolean>('BCV_ALLOW_INSECURE_TLS') ?? false;

    try {
      return await this.fetchHtmlWithTls(!allowInsecure);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isCertificateError =
        /certificate|unable to verify|self[- ]?signed|cert/i.test(message);

      // Fallback: si se solicitó conexión segura pero el certificado de BCV no
      // puede validarse (cadena/CA no disponible), reintentamos sin verificar.
      if (!allowInsecure && isCertificateError) {
        this.logger.warn(
          'No se pudo verificar el certificado TLS de BCV. Reintentando sin verificación de certificado. Configure BCV_ALLOW_INSECURE_TLS=true para omitir este aviso.',
        );
        return await this.fetchHtmlWithTls(false);
      }
      throw error;
    }
  }

  private async fetchHtmlWithTls(rejectUnauthorized: boolean): Promise<string> {
    const agent = new https.Agent({ rejectUnauthorized });

    let lastError: unknown;
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        const { data } = await axios.get<string>(this.BCV_URL, {
          httpsAgent: agent,
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
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const isCertificateError =
          /certificate|unable to verify|self[- ]?signed|cert/i.test(message);

        this.logger.warn(
          `BCV fetch attempt ${attempt}/${RETRY_ATTEMPTS} failed: ${message}`,
        );

        // Un error de certificado no se resuelve reintentando igual; salimos
        // para que fetchHtml aplique el fallback sin verificación.
        if (isCertificateError) break;

        if (attempt < RETRY_ATTEMPTS) {
          await this.sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

  private parseFechaValor($: cheerio.CheerioAPI): Date {
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    const match = bodyText.match(
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
    const rateDate = this.toDateString(date);

    const existing = await this.db
      .select({ id: exchangeRates.id })
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.currencyId, currencyId),
          eq(exchangeRates.rateDate, rateDate),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      this.logger.debug(
        `Rate already exists for currency ${currencyId} on ${rateDate}, skipping`,
      );
      return;
    }

    await this.db
      .insert(exchangeRates)
      .values({
        currencyId,
        rate,
        rateDate,
        source: 'BCV',
        isAutomatic: true,
        fetchedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [exchangeRates.currencyId, exchangeRates.rateDate],
      });
  }

  private toDateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
