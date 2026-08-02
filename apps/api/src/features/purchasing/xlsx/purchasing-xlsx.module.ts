import { Module } from '@nestjs/common';
import { PurchasingXlsxService } from './purchasing-xlsx.service';

@Module({
  providers: [PurchasingXlsxService],
  exports: [PurchasingXlsxService],
})
export class PurchasingXlsxModule {}
