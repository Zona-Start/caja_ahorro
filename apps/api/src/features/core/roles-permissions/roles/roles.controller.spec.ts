import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { ClsService } from 'nestjs-cls';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;
  let cls: ClsService;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockCls = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        { provide: RolesService, useValue: mockService },
        { provide: ClsService, useValue: mockCls },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
    cls = module.get<ClsService>(ClsService);
  });

  const tenantId = 't-1';

  it('findAll should filter by tenant for non-admin', async () => {
    const req = { user: { isSystemAdmin: false } };
    (cls.get as jest.Mock).mockReturnValue(tenantId);
    
    await controller.findAll({} as any, req as any);
    expect(service.findAll).toHaveBeenCalledWith({}, tenantId);
  });

  it('findOne should filter by tenant for non-admin', async () => {
    const req = { user: { isSystemAdmin: false } };
    (cls.get as jest.Mock).mockReturnValue(tenantId);
    
    await controller.findOne('r-1', req as any);
    expect(service.findById).toHaveBeenCalledWith('r-1', tenantId);
  });
});
