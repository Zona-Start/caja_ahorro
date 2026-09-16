import { Button } from '@repo/shadcn/button';
import { Separator } from '@repo/shadcn/separator';
import { PackagePlus } from 'lucide-react';
import { useState } from 'react';
import { useBusinessType } from '@/lib/business-type';
import { QuickPurchaseModal } from '../../movements/components/quick-purchase-modal';
import { ProductsHeader } from '../components/products-header';
import { ProductsList } from '../components/products-list';
import { ProductsModal } from '../components/products-modal';
import { ProductsTableAction } from '../components/products-tables/products-table-action';

export default function ProductsPage() {
  const businessType = useBusinessType();
  const isCommerce = businessType === 'EMPRESA_COMERCIAL';
  const [quickPurchaseOpen, setQuickPurchaseOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <ProductsHeader />
      {isCommerce && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setQuickPurchaseOpen(true)}
          >
            <PackagePlus className="mr-2 h-4 w-4" /> Compra rápida
          </Button>
        </div>
      )}
      <Separator />
      <ProductsTableAction />
      <ProductsList />
      <ProductsModal />
      {isCommerce && (
        <QuickPurchaseModal
          open={quickPurchaseOpen}
          onOpenChange={setQuickPurchaseOpen}
        />
      )}
    </div>
  );
}
