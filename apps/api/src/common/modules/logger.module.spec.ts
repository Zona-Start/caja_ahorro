import { buildPinoHttpOptions, shouldIgnoreAutoLogging } from './logger.module';

describe('Configuración de logging (nestjs-pino)', () => {
  describe('buildPinoHttpOptions', () => {
    it('en producción usa nivel "warn" y NO activa pino-pretty', () => {
      const options = buildPinoHttpOptions('production') as {
        level: string;
        transport?: unknown;
      };

      expect(options.level).toBe('warn');
      expect(options.transport).toBeUndefined();
    });

    it('en desarrollo usa nivel "debug" y activa pino-pretty', () => {
      const options = buildPinoHttpOptions('development') as {
        level: string;
        transport?: { target: string };
      };

      expect(options.level).toBe('debug');
      expect(options.transport?.target).toBe('pino-pretty');
    });
  });

  describe('shouldIgnoreAutoLogging', () => {
    it.each([
      ['/health', 'GET'],
      ['/api/health', 'GET'],
      ['/api/portal/health', 'GET'],
      ['/assets/logo.png', 'GET'],
      ['/uploads/file.pdf', 'GET'],
      ['/api/associates', 'OPTIONS'],
    ])('ignora %s [%s]', (url, method) => {
      expect(shouldIgnoreAutoLogging({ url, method })).toBe(true);
    });

    it('NO ignora peticiones normales de API', () => {
      expect(
        shouldIgnoreAutoLogging({ url: '/api/associates', method: 'GET' }),
      ).toBe(false);
    });
  });
});
