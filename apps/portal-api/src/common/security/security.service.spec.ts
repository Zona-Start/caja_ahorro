import { SecurityService } from './security.service';

describe('SecurityService', () => {
  const service = new SecurityService({
    get: (key: string) => {
      if (key === 'PORTAL_BCRYPT_SALT_ROUNDS') return 4;
      if (key === 'PORTAL_JWT_REFRESH_SECRET') return 'pepper-for-tests';
      return undefined;
    },
  } as never);

  it('hashes and compares passwords', async () => {
    const hash = await service.hashPassword('12345678');
    expect(hash).not.toEqual('12345678');
    await expect(service.comparePassword('12345678', hash)).resolves.toBe(true);
    await expect(service.comparePassword('wrong', hash)).resolves.toBe(false);
  });

  it('produces a deterministic token hash', () => {
    const a = service.hashToken('token-abc');
    const b = service.hashToken('token-abc');
    expect(a).toEqual(b);
    expect(a).not.toEqual(service.hashToken('token-xyz'));
  });

  it('compares hashes in constant time (safeEqual)', () => {
    const a = service.hashToken('same');
    expect(service.safeEqual(a, a)).toBe(true);
    expect(service.safeEqual(a, service.hashToken('other'))).toBe(false);
    expect(service.safeEqual('short', 'much-longer-value')).toBe(false);
  });

  it('generates numeric codes of the requested length', () => {
    const code = service.generateNumericCode(6);
    expect(code).toMatch(/^\d{6}$/);
  });
});
