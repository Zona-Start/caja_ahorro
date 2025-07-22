import { Heading } from '@repo/shadcn/heading';

export default function ServiceHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading title="Servicios" description="Gestiona los servicios" />
      </div>
    </>
  );
}
