import PosPage from '@/features/sales/pos/pages/pos-page';
import { requireCommerce } from '@/lib/auth-guards';

export async function clientLoader() {
  await requireCommerce();
  return null;
}

export default function Route() {
  return <PosPage />;
}
