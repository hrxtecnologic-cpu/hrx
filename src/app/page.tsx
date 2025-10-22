import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  Flame,
  HeartPulse,
  Users,
  Sparkles,
  Music,
  Truck,
  Wrench,
  ChefHat,
  Car,
  CheckCircle,
  Clock,
  Award,
  Headset,
  TrendingUp,
  Building2,
} from 'lucide-react';

export default async function Home() {
  const { userId } = await auth();

  const services = [
    { icon: Shield, name: 'Segurança', color: 'text-blue-500' },
    { icon: Flame, name: 'Bombeiro/Brigadista', color: 'text-orange-500' },
    { icon: HeartPulse, name: 'Saúde', color: 'text-red-500' },
    { icon: Users, name: 'Logística/Staff', color: 'text-purple-500' },
    { icon: Sparkles, name: 'Limpeza', color: 'text-cyan-500' },
    { icon: Music, name: 'Bar/Hospitalidade', color: 'text-pink-500' },
    { icon: Wrench, name: 'Técnico/Audiovisual', color: 'text-yellow-500' },
    { icon: ChefHat, name: 'Cozinha/Garçom', color: 'text-green-500' },
    { icon: Car, name: 'Motorista', color: 'text-indigo-500' },
    { icon: Truck, name: 'Operador', color: 'text-gray-400' },
  ];

  const stats = [
    { value: '500+', label: 'Profissionais Cadastrados' },
    { value: '150+', label: 'Eventos Realizados' },
    { value: '50+', label: 'Empresas Parceiras' },
    { value: '98%', label: 'Satisfação' },
  ];

  const differentials = [
    {
      icon: CheckCircle,
      title: 'Profissionais Verificados',
      description: 'Todos os profissionais passam por verificação de documentos e certificações',
    },
    {
      icon: Clock,
      title: 'Atendimento Rápido',
      description: 'Resposta em até 2 horas durante horário comercial',
    },
    {
      icon: Award,
      title: 'Expertise em Eventos',
      description: 'Equipe especializada com anos de experiência no mercado de eventos',
    },
    {
      icon: Headset,
      title: 'Suporte Completo',
      description: 'Acompanhamento durante todo o evento, do planejamento à execução',
    },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/icons/icone1_hrx_cropped.svg"
                alt="HRX Logo"
                width={800}
                height={576}
                priority
                className="w-auto h-32 md:h-40 lg:h-48 object-contain"
              />
            </div>
            <div className="w-48 md:w-64 h-1 bg-red-600 mx-auto rounded-full" />
          </div>

          {/* Main headline */}
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Encontre os melhores
              <br />
              <span className="text-red-600">profissionais</span> para
              <br />
              seu evento
            </h2>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto">
              Equipe completa, qualificada e pronta para o seu evento.
              <br className="hidden md:block" />
              Segurança, brigadistas, saúde, logística e muito mais.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!userId ? (
              <>
                <Link
                  href="/cadastrar"
                  className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 text-center"
                >
                  SOU PROFISSIONAL
                </Link>
                <Link
                  href="/solicitar-evento"
                  className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-zinc-300 hover:border-red-600 text-zinc-300 hover:text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 text-center"
                >
                  SOLICITAR EVENTO
                </Link>
              </>
            ) : (
              <Link
                href="/onboarding"
                className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 text-center"
              >
                ACESSAR DASHBOARD
              </Link>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-zinc-500 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Profissionais Verificados</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Atendimento Rápido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Documentação em Dia</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Serviços Oferecidos
            </h3>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mb-4" />
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Profissionais qualificados para todas as áreas do seu evento
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-center hover:border-red-600/50 transition-all hover:scale-105 group"
                >
                  <Icon className={`h-12 w-12 mx-auto mb-3 ${service.color} group-hover:scale-110 transition-transform`} />
                  <h4 className="text-white font-medium text-sm">{service.name}</h4>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/solicitar-evento"
              className="inline-block px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105"
            >
              Solicitar Evento
            </Link>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-20 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Como funciona
            </h3>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Para Profissionais */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8">
              <h4 className="text-2xl font-semibold text-red-500 mb-6 text-center">
                Para Profissionais
              </h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold text-white mb-1">Cadastre-se gratuitamente</h5>
                    <p className="text-zinc-400">Preencha seu perfil e envie seus documentos</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold text-white mb-1">Receba oportunidades</h5>
                    <p className="text-zinc-400">Seja notificado sobre vagas compatíveis</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold text-white mb-1">Trabalhe e seja pago</h5>
                    <p className="text-zinc-400">Realize o evento e receba seu pagamento</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/cadastrar"
                  className="inline-block px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
                >
                  Cadastrar-se Agora
                </Link>
              </div>
            </div>

            {/* Para Contratantes */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8">
              <h4 className="text-2xl font-semibold text-red-500 mb-6 text-center">
                Para Contratantes
              </h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold text-white mb-1">Solicite sua equipe</h5>
                    <p className="text-zinc-400">Informe as necessidades do seu evento</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold text-white mb-1">Receba profissionais qualificados</h5>
                    <p className="text-zinc-400">Em até 2 horas você terá uma proposta</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold text-white mb-1">Realize seu evento com sucesso</h5>
                    <p className="text-zinc-400">Equipe completa e suporte durante todo evento</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/solicitar-evento"
                  className="inline-block px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
                >
                  Solicitar Evento
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-red-600/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Números que Impressionam
            </h3>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-red-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-zinc-400 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials Section */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Por que escolher a HRX?
            </h3>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mb-4" />
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Somos especialistas em fornecer profissionais qualificados para eventos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {differentials.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-red-600/50 transition-all"
                >
                  <Icon className="h-12 w-12 text-red-600 mb-4" />
                  <h4 className="text-white font-semibold text-lg mb-2">
                    {item.title}
                  </h4>
                  <p className="text-zinc-400 text-sm">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-red-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Pronto para começar?
          </h3>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Seja você um profissional buscando oportunidades ou uma empresa precisando de equipe,
            a HRX tem a solução perfeita para você.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/cadastrar"
              className="w-full sm:w-auto px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105 text-lg"
            >
              Cadastrar como Profissional
            </Link>
            <Link
              href="/solicitar-evento"
              className="w-full sm:w-auto px-10 py-4 bg-transparent border-2 border-red-600 hover:bg-red-600 text-red-600 hover:text-white font-semibold rounded-lg transition-all hover:scale-105 text-lg"
            >
              Solicitar Evento
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-zinc-500 text-sm">
            <Building2 className="h-4 w-4" />
            <span>Atendimento comercial: Segunda a Sexta, 9h às 18h</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">HRX</h3>
              <p className="text-zinc-500 text-sm">
                Conectando profissionais qualificados a eventos de sucesso.
              </p>
            </div>

            {/* Links Rápidos */}
            <div>
              <h4 className="text-white font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/cadastrar" className="text-zinc-400 hover:text-red-500 transition-colors">
                    Cadastrar-se
                  </Link>
                </li>
                <li>
                  <Link href="/solicitar-evento" className="text-zinc-400 hover:text-red-500 transition-colors">
                    Solicitar Evento
                  </Link>
                </li>
                <li>
                  <Link href="/entrar" className="text-zinc-400 hover:text-red-500 transition-colors">
                    Entrar
                  </Link>
                </li>
              </ul>
            </div>

            {/* Institucional */}
            <div>
              <h4 className="text-white font-semibold mb-4">Institucional</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/sobre" className="text-zinc-400 hover:text-red-500 transition-colors">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="/servicos" className="text-zinc-400 hover:text-red-500 transition-colors">
                    Serviços
                  </Link>
                </li>
                <li>
                  <Link href="/contato" className="text-zinc-400 hover:text-red-500 transition-colors">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/termos" className="text-zinc-400 hover:text-red-500 transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="text-zinc-400 hover:text-red-500 transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="pt-8 border-t border-zinc-900 text-center">
            <p className="text-zinc-600 text-sm">
              &copy; 2025 HRX - Plataforma de Profissionais para Eventos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
