import { Heading } from '@repo/shadcn/heading';

export default function ProductHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading title="Productos" description="Gestiona los productos" />
      </div>
    </>
  );
}
