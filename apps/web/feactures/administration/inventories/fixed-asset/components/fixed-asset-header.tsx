import { Heading } from '@repo/shadcn/heading';

export default function FixedAssetHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Bienes o Activos"
          description="Gestiona los bienes o activos de la caja"
        />
      </div>
    </>
  );
}
