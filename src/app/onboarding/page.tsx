'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verificar se usuário já tem tipo definido e cadastro completo
  useEffect(() => {
    // Aguardar Clerk carregar
    if (!isLoaded) {
      return;
    }

    // Se não tem user (não logou ainda), redirecionar para login
    if (!user) {
      console.log('🔒 [Onboarding] Usuário não encontrado - redirecionando para login');
      router.push('/entrar');
      return;
    }

    // Timeout de segurança: se demorar mais de 5 segundos, mostra a página
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ [Onboarding] Timeout - mostrando página de seleção');
      setChecking(false);
    }, 5000);

    async function checkUserStatus() {
      if (!user) {
        clearTimeout(timeoutId);
        setChecking(false);
        return;
      }

      // VERIFICAR SE É ADMIN PRIMEIRO!
      const isAdmin = user.publicMetadata?.isAdmin === true || user.publicMetadata?.role === 'admin';

      if (isAdmin) {
        console.log('👑 Usuário é ADMIN - redirecionando para /admin');
        clearTimeout(timeoutId);
        router.push('/admin');
        return;
      }

      const userType = user.publicMetadata?.userType as string | undefined;
      const onboardingCompleted = user.publicMetadata?.onboardingCompleted as boolean | undefined;

      /* console.log('🔍 [Onboarding] Verificando metadata do usuário:', {
        email: user.primaryEmailAddress?.emailAddress,
        userType: userType,
        onboardingCompleted: onboardingCompleted,
        publicMetadata: user.publicMetadata,
      }); */

      // IMPORTANTE: Só redirecionar se onboardingCompleted === true
      // Isso evita redirecionamentos automáticos se metadata ficou "preso"
      if (!onboardingCompleted) {
        console.log('⚠️ Onboarding não foi completado - mostrando seleção de tipo');
        clearTimeout(timeoutId);
        setChecking(false);
        return;
      }

      // Se já tem tipo definido E onboarding completo, verificar cadastro
      if (userType === 'professional') {
        // Verificar se existe cadastro profissional COMPLETO
        try {
          const response = await fetch('/api/user/check-registration', {
            signal: AbortSignal.timeout(3000), // Timeout de 3 segundos na requisição
          });
          const data = await response.json();

          if (data.hasProfessionalRegistration) {
            console.log('✅ Usuário profissional com cadastro completo - redirecionando para dashboard');
            clearTimeout(timeoutId);
            router.push('/dashboard/profissional');
            return;
          } else {
            // Tem tipo mas não completou cadastro - redireciona para completar wizard
            console.log('⚠️ Usuário profissional sem cadastro completo - redirecionando para wizard');
            clearTimeout(timeoutId);
            router.push('/cadastro-profissional-wizard');
            return;
          }
        } catch (error) {
          console.error('Erro ao verificar cadastro:', error);
          // Em caso de erro, mostra onboarding
        }
      } else if (userType === 'contractor') {
        // Contratantes não precisam cadastro prévio - vão direto para dashboard
        console.log('✅ Usuário contratante - redirecionando para dashboard');
        clearTimeout(timeoutId);
        router.push('/dashboard/contratante');
        return;
      } else if (userType === 'supplier') {
        // PROBLEMA: Fornecedores escolheram tipo mas podem não ter completado formulário
        // Solução temporária: mostrar onboarding para escolher de novo
        console.log('⚠️ Usuário tem tipo supplier - mostrando onboarding para verificar');
        // TODO: Verificar se fornecedor completou cadastro na API
      }

      clearTimeout(timeoutId);
      setChecking(false);
    }

    checkUserStatus();

    // Cleanup: limpar timeout quando componente desmontar
    return () => clearTimeout(timeoutId);
  }, [user, router, isLoaded]);

  // Mostrar loading enquanto Clerk carrega
  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-700 border-t-red-600" />
          <span className="text-zinc-400">Verificando seu cadastro...</span>
        </div>
      </div>
    );
  }

  async function selectUserType(type: 'professional' | 'contractor' | 'supplier') {
    setLoading(true);

    try {
      console.log('✅ [Onboarding] Usuário autenticado:', user?.id);

      // Aguardar um momento para garantir que sessão do Clerk foi sincronizada
      console.log('⏳ [Onboarding] Aguardando sincronização da sessão...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo

      // Todos os tipos precisam de metadata
      console.log('📤 [Onboarding] Enviando para API:', { userType: type });
      const response = await fetch('/api/user/metadata', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userType: type }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('❌ [Onboarding] Erro ao parsear JSON:', e);
        }
        console.error('❌ [Onboarding] Erro da API:', { status: response.status, errorData });

        // Mensagem de erro mais descritiva
        const errorMessage = errorData.error || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      console.log('✅ [Onboarding] Tipo salvo com sucesso');

      // Aguardar para garantir que metadata foi atualizado no Clerk
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (type === 'professional') {
        router.push('/cadastro-profissional-wizard');
      } else if (type === 'contractor') {
        // Cliente/Contratante vai para wizard com type=client
        router.push('/solicitar-evento-wizard?type=client');
      } else if (type === 'supplier') {
        // Fornecedor vai para wizard com type=supplier
        router.push('/solicitar-evento-wizard?type=supplier');
      }
    } catch (error) {
      console.error('❌ [Onboarding] Erro ao selecionar tipo:', error);

      // Mensagem de erro mais amigável
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar suas preferências:\n\n${errorMessage}\n\nPor favor, tente novamente ou entre em contato com o suporte.`);

      setLoading(false);
    }
  }

  // Verificar se usuário já tem tipo selecionado
  const currentUserType = user?.publicMetadata?.userType as string | undefined;
  const userTypeLabels = {
    professional: 'Profissional',
    contractor: 'Contratante/Cliente',
    supplier: 'Fornecedor'
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6 px-6 py-2 bg-red-600/10 border border-red-600/20 rounded-full">
            <span className="text-red-500 font-semibold">Bem-vindo à HRX! 🎉</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Como você deseja usar a plataforma?
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Selecione uma opção para personalizarmos sua experiência
          </p>

          {/* Aviso se já tiver tipo selecionado */}
          {currentUserType && (
            <div className="mt-6 mx-auto max-w-md p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
              <p className="text-sm text-yellow-500">
                ℹ️ Você já selecionou: <strong>{userTypeLabels[currentUserType as keyof typeof userTypeLabels]}</strong>
                <br />
                Escolha novamente para trocar ou continue o cadastro.
              </p>
            </div>
          )}
        </div>

        {/* Cards de seleção */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card Profissional */}
          <button
            onClick={() => selectUserType('professional')}
            disabled={loading}
            className="group relative p-8 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-2 border-zinc-800 hover:border-red-600 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-zinc-800 overflow-hidden"
          >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:to-red-600/10 transition-all duration-300" />

            <div className="relative z-10">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">
                👷
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-red-500 transition">
                Sou Profissional
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Quero trabalhar em eventos e receber oportunidades de trabalho
              </p>

              {/* Features */}
              <div className="pt-6 border-t border-zinc-800">
                <ul className="text-sm text-zinc-500 space-y-3 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Receba vagas compatíveis com seu perfil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Gerencie seus documentos e certificações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Construa seu histórico profissional</span>
                  </li>
                </ul>
              </div>
            </div>
          </button>

          {/* Card Contratante/Cliente */}
          <button
            onClick={() => selectUserType('contractor')}
            disabled={loading}
            className="group relative p-8 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-2 border-zinc-800 hover:border-red-600 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-zinc-800 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:to-red-600/10 transition-all duration-300" />

            <div className="relative z-10">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">
                🎪
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-red-500 transition">
                Solicitar Evento
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Preciso de profissionais e equipamentos para meu evento
              </p>

              <div className="pt-6 border-t border-zinc-800">
                <ul className="text-sm text-zinc-500 space-y-3 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Equipe completa de profissionais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Equipamentos para eventos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Orçamento personalizado</span>
                  </li>
                </ul>
              </div>
            </div>
          </button>

          {/* Card Fornecedor */}
          <button
            onClick={() => selectUserType('supplier')}
            disabled={loading}
            className="group relative p-8 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-2 border-zinc-800 hover:border-red-600 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-zinc-800 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:to-red-600/10 transition-all duration-300" />

            <div className="relative z-10">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">
                🚚
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-red-500 transition">
                Sou Fornecedor
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Quero fornecer equipamentos para eventos
              </p>

              <div className="pt-6 border-t border-zinc-800">
                <ul className="text-sm text-zinc-500 space-y-3 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Receba solicitações de orçamentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Cadastro rápido e simples</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Aumente suas vendas</span>
                  </li>
                </ul>
              </div>
            </div>
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-700 border-t-red-600" />
              <span className="text-zinc-400">Configurando sua conta...</span>
            </div>
          </div>
        )}

        {/* Footer hint */}
        <p className="text-center text-sm text-zinc-600 mt-8">
          Você poderá alterar isso mais tarde nas configurações
        </p>
      </div>
    </div>
  );
}
