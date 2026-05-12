import { InventoryFixedAssetsHeader } from '../components/inventory-fixed-assets-header';
import InventoryFixedAssetsList from '../components/inventory-fixed-assets-list';
import InventoryFixedAssetsTableAction from '../components/inventory-fixed-assets-tables/inventory-fixed-assets-table-action';

export default function InventoryFixedAssetsPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <InventoryFixedAssetsHeader />
      <InventoryFixedAssetsTableAction />
      <InventoryFixedAssetsList />
    </div>
  );
}
