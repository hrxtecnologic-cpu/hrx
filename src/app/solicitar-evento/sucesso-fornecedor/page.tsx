import { SuccessPage } from '@/components/SuccessPage';

export default function SucessoFornecedorPage() {
  return (
    <SuccessPage
      title="Cadastro Enviado com Sucesso!"
      description="Recebemos seu cadastro como fornecedor e nossa equipe já está analisando as informações."
      steps={[
        {
          number: 1,
          text: 'Nossa equipe irá analisar seu cadastro em até 48 horas úteis',
        },
        {
          number: 2,
          text: 'Você receberá um email de confirmação com os próximos passos',
        },
        {
          number: 3,
          text: 'Após aprovado, você começará a receber solicitações de orçamentos de eventos',
        },
      ]}
      primaryButtonText="Acessar Meu Dashboard"
      primaryButtonHref="/supplier/dashboard"
      showContactInfo={true}
      contactEmail="hrxtecnologic@gmail.com"
      contactPhone="(21) 99876-8572"
    />
  );
}
