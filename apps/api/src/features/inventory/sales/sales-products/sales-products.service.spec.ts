import { Test, TestingModule } from '@nestjs/testing';
import { SalesProductsService } from './sales-products.service';

describe('SalesProductsService', () => {
  let service: SalesProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesProductsService],
    }).compile();

    service = module.get<SalesProductsService>(SalesProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
