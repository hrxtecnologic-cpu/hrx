import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        {/* Logo HRX acima do card */}
        <div className="flex justify-center mb-4">
          <Image
            src="/icons/icon-384x384.png"
            alt="HRX Logo"
            width={150}
            height={150}
            className="object-contain"
          />
        </div>

        {/* Card de Registro */}
        <SignUp
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#ef4444',
              colorText: '#ffffff',
              colorTextOnPrimaryBackground: '#ffffff',
              colorTextSecondary: '#ffffff',
            },
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-zinc-900 border border-zinc-800 shadow-2xl',
              formButtonPrimary:
                'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
            },
          }}
        />
      </div>
    </div>
  );
}
