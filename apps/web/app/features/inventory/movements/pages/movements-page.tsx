import { MovementsHeader } from '../components/movements-header';
import MovementsList from '../components/movements-list';
import MovementsTableAction from '../components/movements-tables/movements-table-action';

export default function MovementsPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <MovementsHeader />
      <MovementsTableAction />
      <MovementsList />
    </div>
  );
}
