import { TtlCache } from './ttl-cache';

describe('TtlCache', () => {
  let now: number;

  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve undefined si la clave no existe', () => {
    const cache = new TtlCache<number>({ ttlMs: 1000 });
    expect(cache.get('x')).toBeUndefined();
  });

  it('almacena y recupera valores', () => {
    const cache = new TtlCache<number>({ ttlMs: 1000 });
    cache.set('x', 42);
    expect(cache.get('x')).toBe(42);
  });

  it('expira la entrada después del TTL', () => {
    const cache = new TtlCache<number>({ ttlMs: 1000 });
    cache.set('x', 42);
    now += 1001;
    expect(cache.get('x')).toBeUndefined();
  });

  it('cachea valores negativos y no repite el factory', async () => {
    const cache = new TtlCache<boolean>({ ttlMs: 1000 });
    const factory = jest.fn().mockResolvedValue(false);

    await expect(cache.getOrSet('no-existe.com', factory)).resolves.toBe(false);
    await expect(cache.getOrSet('no-existe.com', factory)).resolves.toBe(false);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('respeta maxSize al insertar nuevas claves', () => {
    const cache = new TtlCache<number>({ ttlMs: 10_000, maxSize: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // dispara la purga

    expect(cache.size).toBeLessThanOrEqual(2);
  });

  it('rechaza un TTL inválido', () => {
    expect(() => new TtlCache<number>({ ttlMs: 0 })).toThrow();
  });
});
