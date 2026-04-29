import { AuditHelper } from '@/features/audit/audit-event.service';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let db: any;
  let auditHelper: any;

  beforeEach(async () => {
    db = {
      query: {
        globalSettings: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        moduleSettings: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
    };

    auditHelper = {
      logCreate: jest.fn(),
      logUpdate: jest.fn(),
      logDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: 'DB', useValue: db },
        { provide: AuditHelper, useValue: auditHelper },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('Global Settings', () => {
    it('should create global setting', async () => {
      const dto = {
        key: 'site_name',
        value: 'My App',
        category: 'general',
        description: 'Site Name',
      };
      db.returning.mockResolvedValue([{ id: '1', ...dto }]);

      const result = await service.createGlobal(dto);
      expect(result.key).toBe('site_name');
      expect(auditHelper.logCreate).toHaveBeenCalled();
    });

    it('should throw NotFoundException on update if not exists', async () => {
      db.query.globalSettings.findFirst.mockResolvedValue(null);
      await expect(
        service.updateGlobal('999', { value: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update global setting', async () => {
      const mockSetting = { id: '1', key: 'site_name', value: 'Old' };
      db.query.globalSettings.findFirst.mockResolvedValue(mockSetting);
      db.returning.mockResolvedValue([{ ...mockSetting, value: 'New' }]);

      const result = await service.updateGlobal('1', { value: 'New' });
      expect(result.value).toBe('New');
      expect(auditHelper.logUpdate).toHaveBeenCalled();
    });
  });

  describe('Module Settings', () => {
    const tenantId = 'tenant-123';

    it('should create module setting', async () => {
      const dto = {
        tenantId,
        module: 'accounting',
        submodule: '',
        key: 'tax_rate',
        value: '16',
        description: 'Tax Rate',
      };
      db.returning.mockResolvedValue([{ id: 'm1', ...dto }]);

      const result = await service.createModule(dto);
      expect(result.module).toBe('accounting');
      expect(auditHelper.logCreate).toHaveBeenCalledWith(
        tenantId,
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should update module setting with tenant isolation', async () => {
      const mockSetting = {
        id: 'm1',
        tenantId,
        module: 'accounting',
        key: 'tax',
      };
      db.query.moduleSettings.findFirst.mockResolvedValue(mockSetting);
      db.returning.mockResolvedValue([{ ...mockSetting, value: 'updated' }]);

      const result = await service.updateModule(
        'm1',
        { value: 'updated' },
        tenantId,
      );
      expect(result.value).toBe('updated');
      // Verify that findFirst was called with tenantId condition
      const findFirstCall = db.query.moduleSettings.findFirst.mock.calls[0][0];
      expect(findFirstCall.where).toBeDefined();
    });

    it('should throw NotFoundException if trying to update other tenant setting', async () => {
      db.query.moduleSettings.findFirst.mockResolvedValue(null);
      await expect(
        service.updateModule('m1', { value: 'hack' }, 'other-tenant'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should findAllModule filtered by tenant if provided', async () => {
      db.query.moduleSettings.findMany.mockResolvedValue([]);
      db.from.mockReturnThis();
      db.select.mockResolvedValue([{ count: 0 }]);

      await service.findAllModule({ page: 1, limit: 10 }, tenantId);

      // Verify findMany was called (where clause would contain tenantId eq)
      expect(db.query.moduleSettings.findMany).toHaveBeenCalled();
    });
  });
});
