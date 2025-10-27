import { SuccessPage } from '@/components/SuccessPage';

export default function CadastroContratanteSucessoPage() {
  return (
    <SuccessPage
      title="Cadastro Realizado com Sucesso!"
      description="Sua empresa foi cadastrada com sucesso na plataforma HRX como contratante."
      steps={[
        {
          number: 1,
          text: 'Preencha o formulário de solicitação de equipe para seu próximo evento',
        },
        {
          number: 2,
          text: 'Nossa equipe analisará sua solicitação e preparará uma proposta personalizada',
        },
        {
          number: 3,
          text: 'Você receberá a proposta por email com valores e perfis dos profissionais',
        },
        {
          number: 4,
          text: 'Após aprovação, montaremos a equipe ideal para seu evento',
        },
      ]}
      primaryButtonText="Acessar Meu Dashboard"
      primaryButtonHref="/dashboard/contratante"
      showContactInfo={true}
      contactEmail="hrxtecnologic@gmail.com"
      contactPhone="(21) 99876-8572"
    />
  );
}
