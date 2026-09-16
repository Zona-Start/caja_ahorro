import CustomersPage from '@/features/sales/customers/pages/customers-page';
import { requireCommerce } from '@/lib/auth-guards';

export async function clientLoader() {
  await requireCommerce();
  return null;
}

export default function Route() {
  return <CustomersPage />;
}
