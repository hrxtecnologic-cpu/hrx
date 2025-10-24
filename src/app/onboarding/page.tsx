'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verificar se usuário já tem tipo definido e cadastro completo
  useEffect(() => {
    async function checkUserStatus() {
      if (!user) return;

      const userType = user.publicMetadata?.userType as string | undefined;

      console.log('🔍 [Onboarding] Verificando metadata do usuário:', {
        email: user.primaryEmailAddress?.emailAddress,
        userType: userType,
        publicMetadata: user.publicMetadata,
      });

      // Se já tem tipo definido, verificar se tem cadastro completo
      if (userType === 'professional') {
        // Verificar se existe cadastro profissional
        try {
          const response = await fetch('/api/user/check-registration');
          const data = await response.json();

          if (data.hasProfessionalRegistration) {
            console.log('✅ Usuário já tem cadastro profissional - redirecionando para dashboard');
            router.push('/dashboard/profissional');
            return;
          }
        } catch (error) {
          console.error('Erro ao verificar cadastro:', error);
        }
      } else if (userType === 'contractor') {
        // Contratantes podem ir direto para dashboard
        console.log('✅ Usuário contratante - redirecionando para dashboard');
        router.push('/dashboard/contratante');
        return;
      }

      setChecking(false);
    }

    checkUserStatus();
  }, [user, router]);

  // Mostrar loading enquanto verifica
  if (checking) {
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
      // Todos os tipos precisam de metadata
      const response = await fetch('/api/user/metadata', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userType: type }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar tipo de usuário');
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (type === 'professional') {
        router.push('/cadastro-profissional');
      } else {
        // Contratante e Fornecedor vão para o mesmo lugar: /solicitar-evento
        // Lá eles escolhem entre "Cliente" ou "Fornecedor"
        router.push('/solicitar-evento');
      }
    } catch (error) {
      console.error('Erro ao selecionar tipo:', error);
      alert('Erro ao salvar. Tente novamente.');
      setLoading(false);
    }
  }

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
            onClick={() => selectUserType('contractor')}
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
