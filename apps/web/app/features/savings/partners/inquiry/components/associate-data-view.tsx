import { type AssociateDetails } from '../schemas/inquiry-schema';
import { InquiryAssociateDetailsCard } from './inquiry-associate-details-card';
import { InquiryOverviewCards } from './inquiry-overview-cards';
import { InquiryTabs } from './inquiry-tabs';

interface AssociateDataViewProps {
  associate: AssociateDetails;
}

export function AssociateDataView({ associate }: AssociateDataViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        <InquiryAssociateDetailsCard associate={associate} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <InquiryOverviewCards associate={associate} />
      </div>
      <div className="grid gap-6 md:grid-cols-1">
        <InquiryTabs associate={associate} />
      </div>
    </div>
  );
}
