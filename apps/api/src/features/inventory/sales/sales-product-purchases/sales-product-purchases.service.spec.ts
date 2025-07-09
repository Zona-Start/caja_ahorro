import { Test, TestingModule } from '@nestjs/testing';
import { SalesProductPurchasesService } from './sales-product-purchases.service';

describe('SalesProductPurchasesService', () => {
  let service: SalesProductPurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesProductPurchasesService],
    }).compile();

    service = module.get<SalesProductPurchasesService>(SalesProductPurchasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
