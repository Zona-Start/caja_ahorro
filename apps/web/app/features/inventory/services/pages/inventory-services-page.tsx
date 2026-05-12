import { InventoryServicesHeader } from '../components/inventory-services-header';
import InventoryServicesList from '../components/inventory-services-list';
import InventoryServicesTableAction from '../components/inventory-services-tables/inventory-services-table-action';

export default function InventoryServicesPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <InventoryServicesHeader />
      <InventoryServicesTableAction />
      <InventoryServicesList />
    </div>
  );
}
