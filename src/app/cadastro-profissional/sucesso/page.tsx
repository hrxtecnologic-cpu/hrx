import { SuccessPage } from '@/components/SuccessPage';

export default function CadastroSucessoPage() {
  return (
    <SuccessPage
      title="Cadastro Realizado com Sucesso!"
      description="Seu cadastro como profissional foi recebido e está em análise pela nossa equipe."
      steps={[
        {
          number: 1,
          text: 'Em breve você receberá um email de confirmação com os próximos passos',
        },
        {
          number: 2,
          text: 'Nossa equipe irá analisar seus documentos em até 48 horas úteis',
        },
        {
          number: 3,
          text: 'Após aprovado, você começará a receber oportunidades de trabalho',
        },
      ]}
      primaryButtonText="Acessar Meu Dashboard"
      primaryButtonHref="/dashboard/profissional"
      showContactInfo={true}
      contactEmail="hrxtecnologic@gmail.com"
      contactPhone="(21) 99876-8572"
    />
  );
}
