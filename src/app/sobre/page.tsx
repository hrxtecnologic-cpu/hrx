import Link from 'next/link';
import { Target, Users, Award, TrendingUp, Heart, Shield } from 'lucide-react';

export default function SobrePage() {
  const values = [
    {
      icon: Target,
      title: 'Missão',
      description: 'Conectar profissionais qualificados a eventos de sucesso, garantindo excelência e segurança em cada projeto.',
    },
    {
      icon: TrendingUp,
      title: 'Visão',
      description: 'Ser a plataforma referência no Brasil para contratação de profissionais especializados em eventos.',
    },
    {
      icon: Heart,
      title: 'Valores',
      description: 'Compromisso, qualidade, transparência e respeito são os pilares que guiam todas as nossas ações.',
    },
  ];

  const team = [
    {
      icon: Shield,
      title: 'Profissionais Verificados',
      description: 'Rigoroso processo de seleção e verificação de documentos',
    },
    {
      icon: Award,
      title: 'Experiência Comprovada',
      description: 'Anos de atuação no mercado de eventos',
    },
    {
      icon: Users,
      title: 'Equipe Especializada',
      description: 'Profissionais com expertise em diversas áreas',
    },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-600/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Sobre a <span className="text-red-600">HRX</span>
            </h1>
            <div className="w-24 h-1 bg-red-600 mx-auto rounded-full mb-6" />
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto">
              Conectando profissionais qualificados a eventos de sucesso desde o primeiro dia
            </p>
          </div>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-20 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Nossa História
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full" />
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <div className="text-zinc-300 space-y-6 text-lg leading-relaxed">
              <p>
                A <strong className="text-white">HRX</strong> nasceu da necessidade de conectar
                profissionais qualificados com empresas que realizam eventos de todos os portes.
                Identificamos uma lacuna no mercado: a dificuldade de encontrar profissionais
                confiáveis, com documentação em dia e experiência comprovada.
              </p>

              <p>
                Nossa plataforma foi desenvolvida para simplificar esse processo, oferecendo uma
                solução completa tanto para profissionais que buscam oportunidades quanto para
                empresas que precisam de equipes qualificadas para seus eventos.
              </p>

              <p>
                Desde feiras e congressos até shows e eventos corporativos, a HRX garante que cada
                projeto conte com os melhores profissionais, sempre com agilidade, segurança e
                transparência.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Nossos Princípios
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 text-center hover:border-red-600/50 transition-all"
                >
                  <Icon className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-zinc-400">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              O que nos torna únicos
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mb-4" />
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Compromisso com qualidade e segurança em cada detalhe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6"
                >
                  <Icon className="h-12 w-12 text-red-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Áreas de Atuação */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Áreas de Atuação
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mb-8" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Segurança e Controle de Acesso',
              'Bombeiros e Brigadistas',
              'Equipe de Saúde (Enfermagem e Socorristas)',
              'Logística e Staff',
              'Limpeza e Manutenção',
              'Bar e Hospitalidade',
              'Técnicos de Som e Luz',
              'Motoristas e Operadores',
              'Cozinha e Garçons',
              'E muito mais...',
            ].map((area, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 hover:border-red-600/50 transition-all"
              >
                <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full" />
                <span className="text-zinc-300">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-b from-transparent to-red-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Faça parte da HRX
          </h2>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de profissionais e empresas que já confiam na nossa plataforma
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/cadastrar"
              className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105"
            >
              Cadastrar como Profissional
            </Link>
            <Link
              href="/solicitar-equipe"
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-red-600 hover:bg-red-600 text-red-600 hover:text-white font-semibold rounded-lg transition-all hover:scale-105"
            >
              Solicitar Equipe
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
