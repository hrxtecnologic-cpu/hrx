import Link from 'next/link';

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-600/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Política de <span className="text-red-600">Privacidade</span>
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
                  A HRX está comprometida com a proteção da privacidade e segurança dos dados pessoais
                  de seus usuários. Esta Política de Privacidade descreve como coletamos, usamos,
                  armazenamos e protegemos suas informações pessoais, em conformidade com a Lei Geral
                  de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis.
                </p>
              </div>

              {/* Definições */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">2. Definições</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong>Dados Pessoais:</strong> Informação relacionada a pessoa natural identificada
                    ou identificável
                  </li>
                  <li>
                    <strong>Titular:</strong> Pessoa natural a quem se referem os dados pessoais
                  </li>
                  <li>
                    <strong>Controlador:</strong> HRX, responsável pelas decisões sobre o tratamento de
                    dados pessoais
                  </li>
                  <li>
                    <strong>Tratamento:</strong> Toda operação realizada com dados pessoais (coleta, uso,
                    armazenamento, etc.)
                  </li>
                </ul>
              </div>

              {/* Dados Coletados */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">3. Dados que Coletamos</h2>

                <h3 className="text-xl font-semibold text-white mb-2">3.1 Profissionais</h3>
                <p>Ao se cadastrar como profissional, coletamos:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Dados de identificação: Nome completo, CPF, RG, data de nascimento</li>
                  <li>Dados de contato: Email, telefone, endereço completo</li>
                  <li>Dados profissionais: Categorias de atuação, experiência, certificações</li>
                  <li>Documentos: Cópias de RG, CPF, comprovante de endereço, certificados</li>
                  <li>Dados bancários: Banco, agência, conta, chave PIX (para pagamentos)</li>
                  <li>Foto de perfil e fotos de portfólio</li>
                  <li>Informações de disponibilidade</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">3.2 Contratantes</h3>
                <p>Ao solicitar serviços, coletamos:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Dados da empresa: Razão social, CNPJ, endereço</li>
                  <li>Dados do responsável: Nome, cargo, email, telefone</li>
                  <li>Informações do evento: Nome, tipo, local, datas, necessidades</li>
                  <li>Preferências e requisitos específicos</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">3.3 Dados de Navegação</h3>
                <p>Coletamos automaticamente:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Endereço IP e localização geográfica aproximada</li>
                  <li>Tipo de navegador e sistema operacional</li>
                  <li>Páginas visitadas e tempo de navegação</li>
                  <li>Cookies e tecnologias similares</li>
                </ul>
              </div>

              {/* Como Usamos */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">4. Como Usamos seus Dados</h2>
                <p>Utilizamos seus dados pessoais para:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Criar e gerenciar sua conta na plataforma</li>
                  <li>Processar cadastros de profissionais e solicitações de serviços</li>
                  <li>Conectar profissionais a oportunidades de trabalho</li>
                  <li>Processar pagamentos e emitir comprovantes</li>
                  <li>Enviar notificações sobre oportunidades, eventos e atualizações</li>
                  <li>Melhorar nossos serviços e experiência do usuário</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                  <li>Prevenir fraudes e garantir segurança</li>
                  <li>Realizar análises estatísticas e pesquisas de mercado</li>
                  <li>Comunicar mudanças em termos e políticas</li>
                </ul>
              </div>

              {/* Base Legal */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">5. Base Legal para o Tratamento</h2>
                <p>Tratamos seus dados com base em:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong>Consentimento:</strong> Quando você nos autoriza expressamente
                  </li>
                  <li>
                    <strong>Execução de contrato:</strong> Para cumprir obrigações contratuais
                  </li>
                  <li>
                    <strong>Obrigação legal:</strong> Para cumprir determinações legais
                  </li>
                  <li>
                    <strong>Legítimo interesse:</strong> Para melhorar nossos serviços e prevenir fraudes
                  </li>
                </ul>
              </div>

              {/* Compartilhamento */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">6. Compartilhamento de Dados</h2>
                <p>Seus dados podem ser compartilhados com:</p>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">6.1 Entre Usuários</h3>
                <p>
                  Compartilhamos dados necessários entre profissionais e contratantes para viabilizar a
                  prestação de serviços (nome, categoria profissional, experiência, etc.).
                </p>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">6.2 Prestadores de Serviço</h3>
                <p>Podemos compartilhar dados com:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Provedores de hospedagem e armazenamento (Vercel, Supabase)</li>
                  <li>Serviços de email (Resend)</li>
                  <li>Processadores de pagamento</li>
                  <li>Ferramentas de análise e marketing</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">6.3 Autoridades</h3>
                <p>
                  Podemos divulgar dados quando exigido por lei ou para proteger nossos direitos e
                  segurança.
                </p>
              </div>

              {/* Armazenamento */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">7. Armazenamento e Segurança</h2>
                <p>
                  Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Criptografia de dados em trânsito (HTTPS/SSL)</li>
                  <li>Criptografia de dados sensíveis em repouso</li>
                  <li>Controle de acesso baseado em funções</li>
                  <li>Monitoramento e auditoria de acessos</li>
                  <li>Backups regulares</li>
                  <li>Servidores seguros e atualizados</li>
                </ul>
                <p className="mt-4">
                  Seus dados são armazenados em servidores seguros e podem estar localizados no Brasil
                  ou em outros países, sempre com garantias adequadas de proteção.
                </p>
              </div>

              {/* Retenção */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">8. Retenção de Dados</h2>
                <p>
                  Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades
                  descritas nesta política ou conforme exigido por lei.
                </p>
                <ul className="space-y-2 list-disc list-inside mt-4">
                  <li>
                    <strong>Dados de cadastro:</strong> Até solicitação de exclusão ou 5 anos de inatividade
                  </li>
                  <li>
                    <strong>Dados contratuais:</strong> Por no mínimo 5 anos após término do contrato
                    (obrigação legal)
                  </li>
                  <li>
                    <strong>Dados fiscais:</strong> Conforme exigido pela legislação tributária
                  </li>
                </ul>
              </div>

              {/* Direitos do Titular */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">9. Seus Direitos</h2>
                <p>De acordo com a LGPD, você tem direito a:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e acessá-los
                  </li>
                  <li>
                    <strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados
                  </li>
                  <li>
                    <strong>Anonimização, bloqueio ou eliminação:</strong> De dados desnecessários ou
                    tratados em desconformidade
                  </li>
                  <li>
                    <strong>Portabilidade:</strong> Receber seus dados em formato estruturado
                  </li>
                  <li>
                    <strong>Eliminação:</strong> Solicitar exclusão de dados tratados com base em consentimento
                  </li>
                  <li>
                    <strong>Revogação de consentimento:</strong> Retirar consentimento a qualquer momento
                  </li>
                  <li>
                    <strong>Oposição:</strong> Se opor a tratamento realizado sem consentimento
                  </li>
                </ul>

                <p className="mt-4">
                  Para exercer seus direitos, entre em contato através de:{' '}
                  <a href="mailto:privacidade@hrx.com.br" className="text-red-500 hover:text-red-400 underline">
                    privacidade@hrx.com.br
                  </a>
                </p>
              </div>

              {/* Cookies */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">10. Cookies e Tecnologias Similares</h2>
                <p>
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar uso
                  da plataforma e personalizar conteúdo. Você pode gerenciar cookies através das
                  configurações do seu navegador.
                </p>

                <h3 className="text-xl font-semibold text-white mb-2 mt-4">Tipos de Cookies:</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong>Essenciais:</strong> Necessários para funcionamento da plataforma
                  </li>
                  <li>
                    <strong>Funcionais:</strong> Lembram suas preferências
                  </li>
                  <li>
                    <strong>Analíticos:</strong> Ajudam a entender como você usa a plataforma
                  </li>
                  <li>
                    <strong>Marketing:</strong> Personalizam anúncios e conteúdo
                  </li>
                </ul>
              </div>

              {/* Menores */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">11. Proteção de Menores</h2>
                <p>
                  Nossa plataforma não é direcionada a menores de 18 anos. Não coletamos intencionalmente
                  dados de menores de idade. Se tomarmos conhecimento de coleta inadvertida, excluiremos
                  os dados imediatamente.
                </p>
              </div>

              {/* Alterações */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">12. Alterações nesta Política</h2>
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre
                  mudanças significativas por email ou através de aviso na plataforma. Recomendamos
                  revisar esta página regularmente.
                </p>
              </div>

              {/* Encarregado */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">13. Encarregado de Dados (DPO)</h2>
                <p>
                  Nosso Encarregado de Proteção de Dados está disponível para esclarecer dúvidas e
                  receber solicitações relacionadas à proteção de dados:
                </p>
                <ul className="space-y-2 list-none mt-4">
                  <li>📧 Email: dpo@hrx.com.br</li>
                  <li>📧 Email alternativo: privacidade@hrx.com.br</li>
                </ul>
              </div>

              {/* Legislação */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">14. Lei Aplicável e Foro</h2>
                <p>
                  Esta Política de Privacidade é regida pelas leis brasileiras, especialmente pela LGPD
                  (Lei nº 13.709/2018). Para resolução de controvérsias, fica eleito o foro da comarca
                  do Rio de Janeiro, RJ.
                </p>
              </div>

              {/* Contato */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">15. Contato</h2>
                <p>
                  Para questões sobre esta Política de Privacidade ou sobre o tratamento de seus dados:
                </p>
                <ul className="space-y-2 list-none mt-4">
                  <li>📧 Email: privacidade@hrx.com.br</li>
                  <li>📧 DPO: dpo@hrx.com.br</li>
                  <li>📱 WhatsApp: (21) 99999-9999</li>
                  <li>
                    🌐 Site:{' '}
                    <Link href="/contato" className="text-red-500 hover:text-red-400 underline">
                      hrx.com.br/contato
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Data e Versão */}
              <div className="border-t border-zinc-800 pt-8 mt-12">
                <p className="text-sm text-zinc-500">
                  <strong>Versão:</strong> 1.0<br />
                  <strong>Data de vigência:</strong> Janeiro de 2025<br />
                  <strong>Última atualização:</strong> Janeiro de 2025<br />
                  <strong>Conformidade:</strong> LGPD (Lei nº 13.709/2018)
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
            Tem dúvidas sobre privacidade?
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            Entre em contato com nosso Encarregado de Dados
          </p>
          <a
            href="mailto:privacidade@hrx.com.br"
            className="inline-block px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105"
          >
            Enviar Email
          </a>
        </div>
      </section>
    </main>
  );
}
