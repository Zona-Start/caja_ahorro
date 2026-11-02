import { Heading } from '@repo/shadcn/heading';
import { SudecaReportsPage } from '../components/sudeca-reports-page';

export default function SudecaPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <Heading title="Sudeca" description="Reportes financieros trimestrales" />
      <SudecaReportsPage />
    </div>
  );
}
