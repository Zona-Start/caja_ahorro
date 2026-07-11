import { Test, TestingModule } from '@nestjs/testing';
import { SecurityService } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;

  const mockBcrypt = {
    hash: jest
      .fn()
      .mockImplementation((password: string) =>
        Promise.resolve(`hashed_${password}`),
      ),
    compare: jest
      .fn()
      .mockImplementation((password: string, hash: string) =>
        Promise.resolve(password === hash.replace('hashed_', '')),
      ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        { provide: 'BCRYPT_SERVICE', useValue: mockBcrypt },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it.skip('should produce different hashes for same password (due to salt)', async () => {
      // This test requires real bcrypt to produce different salts
      // Using mock, we can't test this properly
    });

    it('should use custom salt rounds when provided', async () => {
      const password = 'testPassword123';
      const hash = await service.hashPassword(password, 10);

      expect(hash).toBeDefined();
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testPassword123';
      const hash = await service.hashPassword(password);

      const result = await service.comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await service.hashPassword(password);

      const result = await service.comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'testPassword123';
      const hash = await service.hashPassword(password);

      const result = await service.comparePassword('', hash);
      expect(result).toBe(false);
    });
  });

  describe('generateRandomString', () => {
    it('should generate a string of specified length', () => {
      const result = service.generateRandomString(32);

      expect(result).toHaveLength(32);
    });

    it('should generate different strings', () => {
      const result1 = service.generateRandomString(32);
      const result2 = service.generateRandomString(32);

      expect(result1).not.toBe(result2);
    });

    it('should default to 32 characters', () => {
      const result = service.generateRandomString();

      expect(result).toHaveLength(32);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const result = service.isValidUUID(validUUID);

      expect(result).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      const invalidUUID = 'not-a-uuid';
      const result = service.isValidUUID(invalidUUID);

      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = service.isValidUUID('');

      expect(result).toBe(false);
    });
  });
});
