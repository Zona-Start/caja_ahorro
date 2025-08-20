import PageContainer from '@/components/layout/page-container';
import InventoryMovementHeader from '@/feactures/administration/inventories/inventory-movements/components/inventory-movement-header';
import InventoryMovementList from '@/feactures/administration/inventories/inventory-movements/components/inventory-movement-list';
import InventoryMovementTableActions from '@/feactures/administration/inventories/inventory-movements/components/inventory-movement-tables/table-actions';
import { searchParamsCache } from '@/feactures/administration/inventories/inventory-movements/utils';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Movimientos de Inventario',
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const page = Number(searchParamsCache.get('page')) || 1;
  const search = searchParamsCache.get('q');
  const pageLimit = Number(searchParamsCache.get('limit')) || 10;
  const itemId = searchParamsCache.get('itemId');
  const itemType = searchParamsCache.get('itemType');
  const movementType = searchParamsCache.get('movementType');
  const documentType = searchParamsCache.get('documentType');
  const documentNumber = searchParamsCache.get('documentNumber');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <InventoryMovementHeader />
        <InventoryMovementTableActions />
        <InventoryMovementList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialItemId={itemId}
          initialItemType={itemType}
          initialMovementType={movementType}
          initialDocumentType={documentType}
          initialDocumentNumber={documentNumber}
        />
      </div>
    </PageContainer>
  );
}
