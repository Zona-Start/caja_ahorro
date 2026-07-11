import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;
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
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: mockService },
        { provide: ClsService, useValue: mockCls },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
    cls = module.get<ClsService>(ClsService);
  });

  const tenantId = 't-1';

  it('findAll should filter by tenant if not system admin', async () => {
    (cls.get as jest.Mock).mockReturnValue(tenantId);
    const req = { user: { isSystemAdmin: false } };
    const query = { page: 1, limit: 10 };

    await controller.findAll(query as any, req as any);
    expect(service.findAll).toHaveBeenCalledWith(query, tenantId);
  });

  it('create should be called with full dto', async () => {
    const dto = { type: 'G', code: 'C', name: 'N', tenantId };
    await controller.create(
      dto as any,
      { user: { isSystemAdmin: false } } as any,
    );
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
