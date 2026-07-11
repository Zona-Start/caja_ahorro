import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantSettingsService } from './tenant-settings.service';

describe('TenantSettingsService', () => {
  let service: TenantSettingsService;
  let db: any;

  beforeEach(async () => {
    db = {
      query: {
        tenantSettings: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantSettingsService,
        { provide: 'DB', useValue: db },
        {
          provide: 'TenantProvisioningService',
          useValue: { isModuleActive: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    service = module.get<TenantSettingsService>(TenantSettingsService);
  });

  describe('findAllByTenant', () => {
    it('should return settings for a tenant', async () => {
      const mockSettings = [{ id: '1', key: 'setting1', tenantId: 'tenant-a' }];
      db.query.tenantSettings.findMany.mockResolvedValue(mockSettings);

      const result = await service.findAllByTenant('tenant-a');
      expect(result).toEqual(mockSettings);
      expect(db.query.tenantSettings.findMany).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a setting', async () => {
      const mockSetting = {
        id: '1',
        key: 'setting1',
        tenantId: 'tenant-a',
        value: 'old',
      };
      db.query.tenantSettings.findFirst.mockResolvedValue(mockSetting);
      db.returning.mockResolvedValue([{ ...mockSetting, value: 'new' }]);

      const result = await service.update('1', { value: 'new' }, 'tenant-a');
      expect(result.value).toBe('new');
      expect(db.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if setting not found', async () => {
      db.query.tenantSettings.findFirst.mockResolvedValue(null);
      await expect(
        service.update('999', { value: 'new' }, 'tenant-a'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
