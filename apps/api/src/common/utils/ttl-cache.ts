export interface TtlCacheOptions {
  /** Tiempo de vida de cada entrada en milisegundos. */
  ttlMs: number;
  /** Número máximo de entradas antes de purgar (por defecto 1000). */
  maxSize?: number;
}

interface TtlEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Caché en memoria con expiración (TTL) y tamaño máximo.
 * Útil para evitar consultas repetidas a la BD en rutas calientes,
 * como la validación dinámica de dominios CORS.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, TtlEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(options: TtlCacheOptions) {
    if (options.ttlMs <= 0) {
      throw new Error('TtlCache: ttlMs debe ser mayor que 0');
    }
    this.ttlMs = options.ttlMs;
    this.maxSize = options.maxSize ?? 1000;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    if (!this.store.has(key) && this.store.size >= this.maxSize) {
      this.evict();
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * Devuelve el valor cacheado o ejecuta `factory` y almacena el resultado.
   * Cachea tanto `true` como `false` (los negativos evitan martillar la BD).
   */
  async getOrSet(key: string, factory: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    this.set(key, value);
    return value;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
    // Si sigue lleno, elimina la entrada más antigua (primera insertada).
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }
  }
}
