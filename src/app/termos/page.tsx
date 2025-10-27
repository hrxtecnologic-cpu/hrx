import Link from 'next/link';

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-600/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Termos de <span className="text-red-600">Uso</span>
            </h1>
            <div className="w-24 h-1 bg-red-600 mx-auto rounded-full mb-6" />
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Última atualização: Janeiro de 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="space-y-8 text-zinc-300">
              {/* Introdução */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">1. Introdução</h2>
                <p>
                  Bem-vindo à HRX. Ao acessar e usar nossa plataforma, você concorda com os termos e
                  condições descritos neste documento. Leia atentamente antes de utilizar nossos serviços.
                </p>
                <p>
                  A HRX é uma plataforma digital que conecta profissionais qualificados a empresas que
                  necessitam de serviços para eventos.
                </p>
              </div>

              {/* Definições */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">2. Definições</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong>Plataforma:</strong> O site HRX e todos os seus serviços relacionados
                  </li>
                  <li>
                    <strong>Usuário:</strong> Qualquer pessoa que acesse a plataforma
                  </li>
                  <li>
                    <strong>Profissional:</strong> Usuário cadastrado que oferece serviços
                  </li>
                  <li>
                    <strong>Contratante:</strong> Empresa ou pessoa que solicita serviços
                  </li>
                  <li>
                    <strong>Serviços:</strong> Todas as funcionalidades oferecidas pela HRX
                  </li>
                </ul>
              </div>

              {/* Uso da Plataforma */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">3. Uso da Plataforma</h2>
                <h3 className="text-xl font-semibold text-white mb-2">3.1 Cadastro</h3>
                <p>
                  Ao criar uma conta na HRX, você se compromete a fornecer informações verdadeiras,
                  precisas e atualizadas. Você é responsável por manter a confidencialidade de sua senha
                  e por todas as atividades realizadas em sua conta.
                </p>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">3.2 Conduta do Usuário</h3>
                <p>Você concorda em NÃO:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Violar qualquer lei ou regulamento aplicável</li>
                  <li>Fornecer informações falsas ou enganosas</li>
                  <li>Usar a plataforma para fins ilegais ou não autorizados</li>
                  <li>Interferir no funcionamento da plataforma</li>
                  <li>Tentar acessar áreas restritas sem autorização</li>
                  <li>Reproduzir, duplicar ou copiar conteúdo sem permissão</li>
                </ul>
              </div>

              {/* Profissionais */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">4. Para Profissionais</h2>
                <h3 className="text-xl font-semibold text-white mb-2">4.1 Cadastro e Documentos</h3>
                <p>
                  Profissionais devem fornecer documentação válida e atualizada, incluindo mas não
                  limitado a: RG, CPF, comprovante de endereço e certificações específicas da área de atuação.
                </p>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">4.2 Aprovação</h3>
                <p>
                  O cadastro será analisado pela equipe HRX. A aprovação não é automática e a HRX reserva-se
                  o direito de recusar cadastros que não atendam aos critérios estabelecidos.
                </p>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">4.3 Responsabilidades</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Manter documentação sempre atualizada</li>
                  <li>Comparecer nos horários e locais estabelecidos</li>
                  <li>Executar os serviços com profissionalismo</li>
                  <li>Seguir todas as normas de segurança aplicáveis</li>
                  <li>Respeitar o código de conduta em eventos</li>
                </ul>
              </div>

              {/* Contratantes */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">5. Para Contratantes</h2>
                <h3 className="text-xl font-semibold text-white mb-2">5.1 Solicitações</h3>
                <p>
                  Contratantes devem fornecer informações completas e precisas sobre o evento e suas
                  necessidades. Mudanças significativas devem ser comunicadas com antecedência.
                </p>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">5.2 Pagamento</h3>
                <p>
                  Os termos de pagamento serão definidos no contrato específico de cada projeto. O não
                  pagamento nos prazos acordados pode resultar em suspensão dos serviços.
                </p>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">5.3 Cancelamentos</h3>
                <p>
                  Cancelamentos devem ser comunicados com antecedência mínima conforme estabelecido no
                  contrato. Cancelamentos tardios podem estar sujeitos a taxas.
                </p>
              </div>

              {/* Propriedade Intelectual */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">6. Propriedade Intelectual</h2>
                <p>
                  Todo o conteúdo da plataforma, incluindo mas não limitado a textos, gráficos, logos,
                  ícones, imagens e software, é propriedade da HRX ou de seus licenciadores e está
                  protegido por leis de direitos autorais.
                </p>
              </div>

              {/* Limitação de Responsabilidade */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">7. Limitação de Responsabilidade</h2>
                <p>
                  A HRX atua como intermediária conectando profissionais a contratantes. Não nos
                  responsabilizamos por:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Ações ou omissões de profissionais durante a prestação de serviços</li>
                  <li>Acidentes ou incidentes ocorridos durante eventos</li>
                  <li>Qualidade final dos serviços prestados por terceiros</li>
                  <li>Disputas entre profissionais e contratantes</li>
                  <li>Perdas ou danos indiretos</li>
                </ul>
                <p className="mt-4">
                  A responsabilidade máxima da HRX será limitada ao valor pago pelos serviços contratados.
                </p>
              </div>

              {/* Privacidade */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">8. Privacidade</h2>
                <p>
                  O uso de dados pessoais é regido por nossa{' '}
                  <Link href="/privacidade" className="text-red-500 hover:text-red-400 underline">
                    Política de Privacidade
                  </Link>
                  , que faz parte integrante destes Termos de Uso.
                </p>
              </div>

              {/* Modificações */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">9. Modificações dos Termos</h2>
                <p>
                  A HRX reserva-se o direito de modificar estes termos a qualquer momento. As alterações
                  entrarão em vigor imediatamente após sua publicação na plataforma. O uso continuado
                  após as alterações constitui aceitação dos novos termos.
                </p>
              </div>

              {/* Rescisão */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">10. Rescisão</h2>
                <p>
                  A HRX pode suspender ou encerrar sua conta a qualquer momento, sem aviso prévio, por
                  violação destes termos ou por conduta que consideremos inadequada ou prejudicial.
                </p>
              </div>

              {/* Lei Aplicável */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">11. Lei Aplicável</h2>
                <p>
                  Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa
                  será resolvida nos tribunais do Rio de Janeiro, RJ.
                </p>
              </div>

              {/* Contato */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">12. Contato</h2>
                <p>
                  Para questões sobre estes Termos de Uso, entre em contato:
                </p>
                <ul className="space-y-2 list-none">
                  <li>🌐 Site: www.hrxeventos.com.br</li>
                  <li>📧 Email: atendimento@hrxeventos.com.br</li>
                  <li>📱 WhatsApp: (21) 99995-2457</li>
                  <li>📧 Jurídico: juridico@hrx.com.br</li>
                  <li>
                    🔗 Contato:{' '}
                    <Link href="/contato" className="text-red-500 hover:text-red-400 underline">
                      /contato
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Data e Versão */}
              <div className="border-t border-zinc-800 pt-8 mt-12">
                <p className="text-sm text-zinc-500">
                  <strong>Versão:</strong> 1.0<br />
                  <strong>Data de vigência:</strong> Janeiro de 2025<br />
                  <strong>Última atualização:</strong> Janeiro de 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-transparent to-red-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Tem alguma dúvida?
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            Nossa equipe está pronta para esclarecer qualquer questão
          </p>
          <Link
            href="/contato"
            className="inline-block px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105"
          >
            Entre em Contato
          </Link>
        </div>
      </section>
    </main>
  );
}
