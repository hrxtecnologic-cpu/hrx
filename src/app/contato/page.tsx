'use client';

import { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export default function ContatoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        subject: formData.get('subject') as string,
        message: formData.get('message') as string,
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      setSubmitted(true);

      // Reset form após 3 segundos
      setTimeout(() => {
        setSubmitted(false);
        (e.target as HTMLFormElement).reset();
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar contato:', error);
      alert('Erro ao enviar mensagem. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '(21) 99995-2457',
      link: 'https://wa.me/5521999952457',
      color: 'text-green-500',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'atendimento@hrxeventos.com.br',
      link: 'mailto:atendimento@hrxeventos.com.br',
      color: 'text-blue-500',
    },
    {
      icon: MapPin,
      title: 'Site',
      value: 'www.hrxeventos.com.br',
      link: 'https://www.hrxeventos.com.br',
      color: 'text-purple-500',
    },
    {
      icon: Clock,
      title: 'Horário',
      value: 'Seg-Sex: 9h às 18h',
      color: 'text-orange-500',
    },
  ];

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-600/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Entre em <span className="text-red-600">Contato</span>
            </h1>
            <div className="w-24 h-1 bg-red-600 mx-auto rounded-full mb-6" />
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto">
              Estamos prontos para atender você. Escolha o canal de sua preferência
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card key={index} className="bg-zinc-900/50 border-zinc-800 hover:border-red-600/50 transition-all">
                  <CardContent className="p-6 text-center">
                    <Icon className={`h-12 w-12 ${info.color} mx-auto mb-4`} />
                    <h3 className="text-white font-semibold mb-2">{info.title}</h3>
                    {info.link ? (
                      <a
                        href={info.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-zinc-400">{info.value}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Envie uma Mensagem
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mb-4" />
            <p className="text-zinc-400">
              Preencha o formulário abaixo e retornaremos em breve
            </p>
          </div>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Mensagem Enviada!
                  </h3>
                  <p className="text-zinc-400">
                    Obrigado pelo contato. Responderemos em breve.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nome */}
                  <div>
                    <Label htmlFor="name" className="text-white">
                      Nome Completo *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="Seu nome"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <Label htmlFor="email" className="text-white">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="seu@email.com"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    {/* Telefone */}
                    <div>
                      <Label htmlFor="phone" className="text-white">
                        Telefone *
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="(00) 00000-0000"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>

                  {/* Assunto */}
                  <div>
                    <Label htmlFor="subject" className="text-white">
                      Assunto *
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      required
                      placeholder="Como podemos ajudar?"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  {/* Mensagem */}
                  <div>
                    <Label htmlFor="message" className="text-white">
                      Mensagem *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      placeholder="Descreva sua necessidade..."
                      className="bg-zinc-800 border-zinc-700 text-white resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-pulse">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-zinc-500 text-center">
                    Respondemos em até 24 horas durante dias úteis
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Rápido */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Perguntas Frequentes
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto rounded-full" />
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Qual o prazo de resposta?
              </h3>
              <p className="text-zinc-400">
                Respondemos todas as solicitações em até 2 horas durante horário comercial
                (Segunda a Sexta, 9h às 18h). Fora desse horário, retornaremos no próximo dia útil.
              </p>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Como funciona a contratação?
              </h3>
              <p className="text-zinc-400">
                Você preenche o formulário de solicitação, nossa equipe analisa e envia uma proposta
                personalizada com valores, perfis dos profissionais e cronograma.
              </p>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Posso solicitar orçamento por WhatsApp?
              </h3>
              <p className="text-zinc-400">
                Sim! Você pode entrar em contato via WhatsApp, email ou telefone. Mas recomendamos
                usar o formulário de solicitação de equipe para agilizar o processo.
              </p>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Atendem em todo o Brasil?
              </h3>
              <p className="text-zinc-400">
                Atualmente atendemos principalmente no Rio de Janeiro e região. Para outras localidades,
                entre em contato para verificarmos a disponibilidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Alternative */}
      <section className="py-20 bg-gradient-to-b from-transparent to-red-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prefere solicitar diretamente?
          </h2>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Use nosso formulário de solicitação de equipe para receber uma proposta personalizada
          </p>

          <a
            href="/solicitar-equipe"
            className="inline-block px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105 text-lg"
          >
            Solicitar Equipe Agora
          </a>
        </div>
      </section>
    </main>
  );
}
