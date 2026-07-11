import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;
  let cls: ClsService;

  beforeEach(async () => {
    const mockService = {
      findAllGlobal: jest.fn(),
      getGlobal: jest.fn(),
      createGlobal: jest.fn(),
      updateGlobal: jest.fn(),
      removeGlobal: jest.fn(),
      findAllModule: jest.fn(),
      getModule: jest.fn(),
      createModule: jest.fn(),
      updateModule: jest.fn(),
      removeModule: jest.fn(),
    };

    const mockCls = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: mockService },
        { provide: ClsService, useValue: mockCls },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
    cls = module.get<ClsService>(ClsService);
  });

  describe('Global Settings (Superadmin)', () => {
    it('should call createGlobal', async () => {
      const dto = { key: 'k', value: 'v', category: 'c' };
      await controller.createGlobal(dto as any);
      expect(service.createGlobal).toHaveBeenCalledWith(dto);
    });
  });

  describe('Module Settings (Tenant/Superadmin)', () => {
    const tenantId = 't-1';

    it('should call findAllModule with current tenantId for non-admin', async () => {
      (cls.get as jest.Mock).mockReturnValue(tenantId);
      const req = { user: { isSystemAdmin: false } };

      await controller.findAllModule({} as any, req as any);

      expect(service.findAllModule).toHaveBeenCalledWith({}, tenantId);
    });

    it('should call findAllModule with undefined tenantId for system admin', async () => {
      (cls.get as jest.Mock).mockReturnValue(tenantId);
      const req = { user: { isSystemAdmin: true } };

      await controller.findAllModule({} as any, req as any);

      expect(service.findAllModule).toHaveBeenCalledWith({}, undefined);
    });

    it('should call updateModule with tenant isolation for non-admin', async () => {
      (cls.get as jest.Mock).mockReturnValue(tenantId);
      const req = { user: { isSystemAdmin: false } };
      const dto = { value: 'new' };

      await controller.updateModule('id-1', dto, req as any);

      expect(service.updateModule).toHaveBeenCalledWith('id-1', dto, tenantId);
    });
  });
});
