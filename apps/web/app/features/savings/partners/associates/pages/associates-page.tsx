import { Separator } from '@repo/shadcn/separator';
import { AssociatesHeader } from '../components/associates-header';
import AssociatesList from '../components/associates-list';
import AssociatesTableAction from '../components/associates-tables/associates-table-action';

export default function AssociatesPage() {
  return (
    <div className="space-y-4">
      <AssociatesHeader />
      <Separator />
      <AssociatesTableAction />
      <AssociatesList />
    </div>
  );
}
