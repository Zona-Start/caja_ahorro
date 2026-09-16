import ReceivablesPage from '@/features/sales/receivables/pages/receivables-page';
import { requireCommerce } from '@/lib/auth-guards';

export async function clientLoader() {
  await requireCommerce();
  return null;
}

export default function Route() {
  return <ReceivablesPage />;
}
