import { Separator } from '@repo/shadcn/separator';
import { ProductsHeader } from '../components/products-header';
import { ProductsList } from '../components/products-list';
import { ProductsModal } from '../components/products-modal';
import { ProductsTableAction } from '../components/products-tables/products-table-action';

export default function ProductsPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <ProductsHeader />
      <Separator />
      <ProductsTableAction />
      <ProductsList />
      <ProductsModal />
    </div>
  );
}
