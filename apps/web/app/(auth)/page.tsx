import { LoginForm } from '@/feactures/auth/components/sigin-view';
import { Montserrat } from 'next/font/google';

const RobotoMono = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  weight: ['900'],
});

const Page = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
};

export default Page;
