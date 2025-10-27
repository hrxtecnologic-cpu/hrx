import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Zap,
  Users,
  Package,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3,
  Truck,
  Bell,
  Database,
} from 'lucide-react';

export default async function Home() {
  const { userId } = await auth();

  const platformFeatures = [
    {
      icon: MapPin,
      title: 'Geolocalização Inteligente',
      description: 'Mapbox integrado para conexões perfeitas baseadas em proximidade',
      color: 'text-red-500',
      gradient: 'from-red-500/20 to-transparent',
    },
    {
      icon: Truck,
      title: 'Tracking em Tempo Real',
      description: 'Monitore entregas, equipamentos e equipes ao vivo',
      color: 'text-red-500',
      gradient: 'from-red-500/20 to-transparent',
    },
    {
      icon: Users,
      title: 'Marketplace Duplo',
      description: 'Profissionais especializados + fornecedores de equipamentos',
      color: 'text-red-500',
      gradient: 'from-red-500/20 to-transparent',
    },
    {
      icon: BarChart3,
      title: 'Gestão Financeira',
      description: 'Dashboard completo com cálculos automáticos e relatórios',
      color: 'text-red-500',
      gradient: 'from-red-500/20 to-transparent',
    },
    {
      icon: Zap,
      title: 'Matching Preciso',
      description: 'Conectamos os profissionais certos para cada evento',
      color: 'text-red-500',
      gradient: 'from-red-500/20 to-transparent',
    },
    {
      icon: Bell,
      title: 'Notificações Inteligentes',
      description: 'Sistema completo de alertas e atualizações em tempo real',
      color: 'text-red-500',
      gradient: 'from-red-500/20 to-transparent',
    },
  ];

  const stats = [
    { value: '100%', label: 'Digital', icon: Database },
    { value: '24/7', label: 'Monitoramento', icon: Clock },
    { value: 'HRX', label: 'Matching', icon: Sparkles },
    { value: 'GPS', label: 'Tracking', icon: MapPin },
  ];

  const differentials = [
    {
      icon: Target,
      title: 'Plataforma Completa',
      description: 'Da cotação à execução - tudo em um único sistema integrado',
    },
    {
      icon: Shield,
      title: 'Conexões Verificadas',
      description: 'Todos os profissionais e fornecedores passam por validação rigorosa',
    },
    {
      icon: TrendingUp,
      title: 'Escalável',
      description: 'Sistema robusto preparado para crescer junto com seu negócio',
    },
    {
      icon: CheckCircle,
      title: 'Confiável',
      description: 'Tecnologia de ponta com backup, segurança e alta disponibilidade',
    },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section - Moderna e impactante */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-red-600/5 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.1),transparent)]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          {/* Logo */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Image
                src="/icons/icone1_hrx_cropped.svg"
                alt="HRX Logo"
                width={800}
                height={576}
                priority
                className="w-auto h-28 md:h-36 lg:h-44 object-contain animate-fade-in"
              />
            </div>
            <div className="w-56 md:w-72 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto rounded-full" />
          </div>

          {/* Main headline */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
              Plataforma Digital de
              <br />
              <span className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
                Eventos Inteligente
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 max-w-4xl mx-auto leading-relaxed">
              Conectamos profissionais e fornecedores com eventos através de
              <span className="text-red-500 font-semibold"> Qualidade de Serviço</span>,
              <span className="text-red-500 font-semibold"> tracking em tempo real</span> e
              <span className="text-red-500 font-semibold"> geolocalização precisa </span>.
            </p>
            <p className="text-lg text-zinc-400 max-w-3xl mx-auto mt-4">
              Gestão completa de ponta a ponta - da cotação à entrega.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {!userId ? (
              <>
                <Link
                  href="/onboarding"
                  className="group w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 text-center shadow-lg shadow-red-600/50 flex items-center justify-center gap-2"
                >
                  COMEÇAR AGORA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/entrar"
                  className="w-full sm:w-auto px-10 py-5 bg-zinc-900 border-2 border-zinc-700 hover:border-red-600 text-zinc-300 hover:text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 text-center"
                >
                  JÁ TENHO CONTA
                </Link>
              </>
            ) : (
              <Link
                href="/onboarding"
                className="group w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 text-center shadow-lg shadow-red-600/50 flex items-center justify-center gap-2"
              >
                ACESSAR DASHBOARD
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 text-center hover:border-red-600/50 transition-all group"
                >
                  <Icon className="w-8 h-8 mx-auto mb-2 text-red-500 group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-zinc-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features - O que nos torna únicos */}
      <section className="py-24 bg-gradient-to-b from-zinc-950 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full mb-4">
              <span className="text-red-500 font-semibold text-sm">TECNOLOGIA DE PONTA</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Sistema Completo em uma
              <span className="text-red-500"> Única Plataforma</span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Não somos apenas um marketplace. Somos uma produtora digital de eventos com tecnologia que conecta, gerencia e monitora em tempo real.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-8 hover:border-red-600/50 transition-all hover:scale-105"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} />
                  <div className="relative">
                    <div className="mb-4">
                      <Icon className={`w-12 h-12 ${feature.color} group-hover:scale-110 transition-transform`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works - Processo simplificado */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(239,68,68,0.05),transparent)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full mb-4">
              <span className="text-red-500 font-semibold text-sm">COMO FUNCIONA</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Simples, Rápido e
              <span className="text-red-500"> Inteligente</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Para Contratantes */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-red-600/20 rounded-full blur-xl" />
              <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-zinc-800 rounded-3xl p-10 hover:border-red-600/50 transition-all">
                <div className="mb-8">
                  <div className="inline-block px-4 py-2 bg-red-600 rounded-full mb-4">
                    <span className="text-white font-bold text-sm">PARA CONTRATANTES</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    Crie seu evento em minutos
                  </h3>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      step: '1',
                      title: 'Descreva o evento',
                      desc: 'Data, local, tipo de evento e necessidades',
                    },
                    {
                      step: '2',
                      title: 'Receba sugestões',
                      desc: 'IA seleciona os melhores profissionais e fornecedores',
                    },
                    {
                      step: '3',
                      title: 'Monitore tudo',
                      desc: 'Dashboard com tracking, timeline e status em tempo real',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-red-600/50 group-hover:scale-110 transition-transform">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg mb-1">{item.title}</h4>
                        <p className="text-zinc-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Link
                    href="/onboarding"
                    className="block w-full px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all text-center hover:scale-105"
                  >
                    Solicitar Evento Agora
                  </Link>
                </div>
              </div>
            </div>

            {/* Para Profissionais */}
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-600/20 rounded-full blur-xl" />
              <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-zinc-800 rounded-3xl p-10 hover:border-red-600/50 transition-all">
                <div className="mb-8">
                  <div className="inline-block px-4 py-2 bg-zinc-800 border border-red-600 rounded-full mb-4">
                    <span className="text-white font-bold text-sm">PARA PROFISSIONAIS</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    Encontre trabalhos próximos
                  </h3>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      step: '1',
                      title: 'Cadastre-se grátis',
                      desc: 'Perfil verificado com documentos e certificações',
                    },
                    {
                      step: '2',
                      title: 'Seja encontrado',
                      desc: 'Geolocalização conecta você com eventos próximos',
                    },
                    {
                      step: '3',
                      title: 'Trabalhe e ganhe',
                      desc: 'Dashboard com agenda, pagamentos e histórico',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-red-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-red-600/50 group-hover:scale-110 transition-transform">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg mb-1">{item.title}</h4>
                        <p className="text-zinc-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Link
                    href="/onboarding"
                    className="block w-full px-6 py-4 bg-zinc-800 border-2 border-red-600 hover:bg-red-600 text-white font-bold rounded-xl transition-all text-center hover:scale-105"
                  >
                    Cadastrar como Profissional
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section className="py-24 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full mb-4">
              <span className="text-red-500 font-semibold text-sm">POR QUE HRX</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Mais que um Marketplace,
              <br />
              <span className="text-red-500">uma Plataforma Completa</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {differentials.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-8 text-center hover:border-red-600/50 transition-all hover:scale-105 group"
                >
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-red-500" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-transparent to-red-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.15),transparent)]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Pronto para transformar
            <br />
            <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent">
              seus eventos?
            </span>
          </h2>
          <p className="text-xl text-zinc-300 mb-12 max-w-2xl mx-auto">
            Junte-se à plataforma digital mais completa do mercado de eventos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="group px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all hover:scale-105 text-center shadow-lg shadow-red-600/50 flex items-center justify-center gap-2"
            >
              COMEÇAR AGORA - É GRÁTIS
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-zinc-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">HRX Eventos</h3>
              <p className="text-zinc-400 text-sm">
                Plataforma digital completa para gestão inteligente de eventos.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Links Rápidos</h3>
              <div className="space-y-2">
                <Link href="/sobre" className="block text-zinc-400 hover:text-red-500 text-sm transition-colors">
                  Sobre
                </Link>
                <Link href="/servicos" className="block text-zinc-400 hover:text-red-500 text-sm transition-colors">
                  Serviços
                </Link>
                <Link href="/contato" className="block text-zinc-400 hover:text-red-500 text-sm transition-colors">
                  Contato
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <div className="space-y-2">
                <Link href="/termos" className="block text-zinc-400 hover:text-red-500 text-sm transition-colors">
                  Termos de Uso
                </Link>
                <Link href="/privacidade" className="block text-zinc-400 hover:text-red-500 text-sm transition-colors">
                  Privacidade
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-900 pt-8 text-center text-zinc-500 text-sm">
            <p>© 2025 HRX Eventos. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
