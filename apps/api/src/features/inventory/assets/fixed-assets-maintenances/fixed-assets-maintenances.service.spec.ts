import { Test, TestingModule } from '@nestjs/testing';
import { FixedAssetsMaintenancesService } from './fixed-assets-maintenances.service';

describe('FixedAssetsMaintenancesService', () => {
  let service: FixedAssetsMaintenancesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FixedAssetsMaintenancesService],
    }).compile();

    service = module.get<FixedAssetsMaintenancesService>(FixedAssetsMaintenancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
