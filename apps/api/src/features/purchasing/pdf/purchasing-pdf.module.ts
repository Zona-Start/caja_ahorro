import { Module } from '@nestjs/common';
import { PurchasingPdfService } from './purchasing-pdf.service';

@Module({
  providers: [PurchasingPdfService],
  exports: [PurchasingPdfService],
})
export class PurchasingPdfModule {}
