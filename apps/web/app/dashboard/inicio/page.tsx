import Image from 'next/image';

export default async function Page() {
  return (
    <div className="flex flex-col items-center justify-center  pt-20 from-primary/20 to-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold ">Bienvenidos</h1>
        <div className="relative w-64 h-64 mx-auto">
          <Image
            src="/logo.png"
            alt="Logo del sistema"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <p className="text-xl text-muted-foreground">
          Estamos encantados de tenerte aquí.
        </p>
      </div>
    </div>
  );
}
