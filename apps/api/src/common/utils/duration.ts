const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365.25 * 24 * 60 * 60 * 1000,
};

export function durationToMs(
  value: string | number | undefined,
  fallbackMs: number,
): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value * 1000;
  }

  if (typeof value !== 'string') {
    return fallbackMs;
  }

  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w|y)?$/i);
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) {
    return fallbackMs;
  }

  const unit = (match[2] ?? 's').toLowerCase();
  return amount * (UNIT_MS[unit] ?? 1000);
}
