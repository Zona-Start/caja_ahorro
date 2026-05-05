import { PageContainer } from '@/components/shared/page-container';
import { Separator } from '@repo/shadcn/separator';
import { AssociatesHeader } from '../components/associates-header';
import AssociatesTableAction from '../components/associates-tables/associates-table-action';
import AssociatesList from '../components/associates-list';

export default function AssociatesPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <AssociatesHeader />
        <Separator />
        <AssociatesTableAction />
        <AssociatesList />
      </div>
    </PageContainer>
  );
}
