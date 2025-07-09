import { Test, TestingModule } from '@nestjs/testing';
import { FixedAssetsMaintenancesController } from './fixed-assets-maintenances.controller';
import { FixedAssetsMaintenancesService } from './fixed-assets-maintenances.service';

describe('FixedAssetsMaintenancesController', () => {
  let controller: FixedAssetsMaintenancesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FixedAssetsMaintenancesController],
      providers: [FixedAssetsMaintenancesService],
    }).compile();

    controller = module.get<FixedAssetsMaintenancesController>(FixedAssetsMaintenancesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
