import { Heading } from '@repo/shadcn/heading';

export default function FixedAssetHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading title="Bienes" description="Gestiona los bienes" />
      </div>
    </>
  );
}
