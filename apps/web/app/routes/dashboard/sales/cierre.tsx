import CloseCashPage from '@/features/sales/close-cash/pages/close-cash-page';
import { requireCommerce } from '@/lib/auth-guards';

export async function clientLoader() {
  await requireCommerce();
  return null;
}

export default function Route() {
  return <CloseCashPage />;
}
