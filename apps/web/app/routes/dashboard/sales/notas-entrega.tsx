import DeliveryNotesPage from '@/features/sales/delivery-notes/pages/delivery-notes-page';
import { requireCommerce } from '@/lib/auth-guards';

export async function clientLoader() {
  await requireCommerce();
  return null;
}

export default function Route() {
  return <DeliveryNotesPage />;
}
