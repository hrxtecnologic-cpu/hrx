import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();

  // Se já completou onboarding, redireciona baseado no tipo de usuário
  if (sessionClaims?.metadata?.onboardingComplete) {
    const userType = sessionClaims.metadata.userType;

    /* console.log('✅ [Onboarding Layout] Usuário já completou onboarding:', {
      userType,
      redirecting: true,
    }); */

    // Redireciona para o dashboard apropriado
    if (userType === 'professional') {
      redirect('/dashboard/profissional');
    } else if (userType === 'contractor') {
      redirect('/dashboard/contratante');
    } else if (userType === 'supplier') {
      redirect('/supplier/dashboard');
    } else {
      // Fallback: se não tem tipo definido mas onboarding está completo
      redirect('/');
    }
  }

  return <>{children}</>;
}
