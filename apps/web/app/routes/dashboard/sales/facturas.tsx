import InvoicesPage from '@/features/sales/invoices/pages/invoices-page';
import { requireCommerce } from '@/lib/auth-guards';

export async function clientLoader() {
  await requireCommerce();
  return null;
}

export default function Route() {
  return <InvoicesPage />;
}
