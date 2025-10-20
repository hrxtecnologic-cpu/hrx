import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">HRX</h1>
          <p className="text-zinc-400">Crie sua conta gratuita</p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-zinc-900 border border-zinc-800 shadow-2xl',
              headerTitle: 'text-white text-2xl',
              headerSubtitle: 'text-zinc-400',
              socialButtonsBlockButton:
                'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-red-600 text-white transition-all',
              socialButtonsBlockButtonText: 'text-white font-medium',
              formButtonPrimary:
                'bg-red-600 hover:bg-red-500 active:bg-red-700 transition-all',
              footerActionLink: 'text-red-500 hover:text-red-400',
              formFieldInput:
                'bg-zinc-800 border-zinc-700 text-white focus:border-red-600 focus:ring-red-600',
              formFieldLabel: 'text-zinc-300',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-red-500 hover:text-red-400',
              formFieldInputShowPasswordButton: 'text-zinc-400 hover:text-white',
              dividerLine: 'bg-zinc-700',
              dividerText: 'text-zinc-500',
              formHeaderTitle: 'text-white',
              formHeaderSubtitle: 'text-zinc-400',
              otpCodeFieldInput: 'bg-zinc-800 border-zinc-700 text-white',
              formResendCodeLink: 'text-red-500 hover:text-red-400',
            },
          }}
        />
      </div>
    </div>
  );
}
