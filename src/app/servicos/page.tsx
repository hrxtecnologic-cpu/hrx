import Link from 'next/link';
import {
  Shield,
  Flame,
  HeartPulse,
  Users,
  Sparkles,
  Music,
  Wrench,
  ChefHat,
  Car,
  Truck,
  CheckCircle,
  Package,
} from 'lucide-react';

export default function ServicosPage() {
  const services = [
    {
      icon: Shield,
      name: 'Segurança',
      description: 'Profissionais treinados para controle de acesso, segurança patrimonial e pessoal.',
      features: [
        'Controle de acesso',
        'Revista de segurança',
        'Rondas preventivas',
        'Segurança VIP',
        'Detector de metais',
      ],
      certifications: ['Curso de Segurança', 'Registro em dia'],
    },
    {
      icon: Flame,
      name: 'Bombeiro/Brigadista',
      description: 'Brigadistas certificados para prevenção e combate a incêndios.',
      features: [
        'Prevenção de incêndios',
        'Combate inicial',
        'Evacuação de emergência',
        'Primeiros socorros',
        'Inspeção preventiva',
      ],
      certifications: ['NR-23', 'Brigada de Incêndio', 'AVCB'],
    },
    {
      icon: HeartPulse,
      name: 'Saúde',
      description: 'Equipe médica e de enfermagem para atendimento emergencial.',
      features: [
        'Socorristas',
        'Enfermeiros',
        'Técnicos de enfermagem',
        'Ambulatório',
        'Ambulância (se necessário)',
      ],
      certifications: ['COREN', 'APH', 'Suporte Básico de Vida'],
    },
    {
      icon: Users,
      name: 'Logística/Staff',
      description: 'Equipe de apoio para organização e fluxo do evento.',
      features: [
        'Recepção',
        'Credenciamento',
        'Informações',
        'Orientação de público',
        'Apoio geral',
      ],
      certifications: ['Treinamento específico', 'Uniformização'],
    },
    {
      icon: Sparkles,
      name: 'Limpeza',
      description: 'Profissionais de limpeza para manter o evento impecável.',
      features: [
        'Limpeza durante evento',
        'Limpeza pós-evento',
        'Coleta seletiva',
        'Higienização de banheiros',
        'Manutenção de áreas',
      ],
      certifications: ['Treinamento em limpeza de eventos'],
    },
    {
      icon: Music,
      name: 'Bar/Hospitalidade',
      description: 'Bartenders, barbacks e equipe de hospitalidade.',
      features: [
        'Barman',
        'Barback',
        'Garçom',
        'Coquetéis',
        'Atendimento VIP',
      ],
      certifications: ['Cursos de coquetelaria', 'Atendimento ao cliente'],
    },
    {
      icon: Wrench,
      name: 'Técnico/Audiovisual',
      description: 'Técnicos especializados em som, luz e estrutura.',
      features: [
        'Técnico de som',
        'Técnico de luz',
        'Operação de equipamentos',
        'Manutenção técnica',
        'Suporte audiovisual',
      ],
      certifications: ['NR-10', 'NR-35', 'Experiência técnica'],
    },
    {
      icon: ChefHat,
      name: 'Cozinha/Garçom',
      description: 'Profissionais de gastronomia e serviço de mesa.',
      features: [
        'Cozinheiros',
        'Auxiliares de cozinha',
        'Garçons',
        'Copeiros',
        'Buffet',
      ],
      certifications: ['Manipulação de alimentos', 'Boas práticas'],
    },
    {
      icon: Car,
      name: 'Motorista',
      description: 'Motoristas profissionais com CNH e experiência.',
      features: [
        'Transporte de equipe',
        'Transporte VIP',
        'Vans e ônibus',
        'Motorista executivo',
        'Conhecimento de rotas',
      ],
      certifications: ['CNH categoria D/E', 'Curso de direção defensiva'],
    },
    {
      icon: Truck,
      name: 'Operador de Empilhadeira',
      description: 'Operadores certificados para movimentação de carga.',
      features: [
        'Movimentação de carga',
        'Montagem de estruturas',
        'Logística de materiais',
        'Operação segura',
        'Inspeção de equipamentos',
      ],
      certifications: ['NR-11', 'Habilitação para empilhadeira'],
    },
  ];

  const additionalServices = [
    {
      icon: Package,
      title: 'Equipamentos',
      items: [
        'Ambulância',
        'Ambulatório',
        'Geradores',
        'Extintores',
        'Grades e barreiras',
        'Tendas',
        'Rádios de comunicação',
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-600/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Nossos <span className="text-red-600">Serviços</span>
            </h1>
            <div className="w-24 h-1 bg-red-600 mx-auto rounded-full mb-6" />
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto">
              Profissionais qualificados para todas as necessidades do seu evento
            </p>
          </div>
        </div>
      </section>

      {/* Serviços Principais */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Categorias Profissionais
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mb-4" />
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Profissionais certificados e com experiência comprovada
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-red-600/50 transition-all"
                >
                  <Icon className="h-12 w-12 text-red-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {service.name}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-zinc-300 mb-2">
                      Serviços inclusos:
                    </h4>
                    <ul className="space-y-1">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Certifications */}
                  <div className="pt-4 border-t border-zinc-800">
                    <h4 className="text-xs font-semibold text-zinc-500 mb-2">
                      Certificações:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {service.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-red-600/10 text-red-400 px-2 py-1 rounded"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Equipamentos Adicionais */}
      <section className="py-20 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Equipamentos Adicionais
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mb-4" />
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Além de profissionais, também fornecemos equipamentos essenciais
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {additionalServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8"
                >
                  <Icon className="h-12 w-12 text-red-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {service.title}
                  </h3>
                  <ul className="space-y-2">
                    {service.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-zinc-400">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* Customização */}
            <div className="md:col-span-2 bg-gradient-to-r from-red-600/10 to-transparent border border-red-600/30 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-3">
                Precisa de algo específico?
              </h3>
              <p className="text-zinc-400 mb-6">
                Trabalhamos com soluções customizadas para atender todas as necessidades do seu evento
              </p>
              <Link
                href="/contato"
                className="inline-block px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
              >
                Entre em Contato
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Como Contratar
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full" />
          </div>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Faça sua Solicitação
                </h3>
                <p className="text-zinc-400">
                  Preencha o formulário informando as necessidades do seu evento: categorias profissionais,
                  quantidades, horários e equipamentos necessários.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Receba uma Proposta
                </h3>
                <p className="text-zinc-400">
                  Em até 2 horas durante horário comercial, nossa equipe entrará em contato com uma proposta
                  detalhada incluindo valores, perfis dos profissionais e cronograma.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Aprove e Contrate
                </h3>
                <p className="text-zinc-400">
                  Após aprovação da proposta, formalizamos o contrato e preparamos toda a equipe para o seu evento.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Realize seu Evento
                </h3>
                <p className="text-zinc-400">
                  Nossa equipe estará presente e pronta para garantir o sucesso do seu evento, com suporte
                  completo do início ao fim.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-b from-transparent to-red-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para contratar?
          </h2>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Solicite agora sua equipe e receba uma proposta personalizada em até 2 horas
          </p>

          <Link
            href="/solicitar-equipe"
            className="inline-block px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105 text-lg"
          >
            Solicitar Equipe Agora
          </Link>

          <p className="mt-6 text-sm text-zinc-500">
            Atendimento comercial: Segunda a Sexta, 9h às 18h
          </p>
        </div>
      </section>
    </main>
  );
}
