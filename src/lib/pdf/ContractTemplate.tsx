/**
 * =====================================================
 * Template de Contrato de Prestação de Serviços - PDF
 * =====================================================
 * Gera PDF do contrato usando React-PDF
 * =====================================================
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Registrar fontes (opcional - usar web safe fonts)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf', fontWeight: 700 },
  ],
});

// Estilos
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Roboto',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2pt solid #DC2626',
    paddingBottom: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: '#DC2626',
    marginBottom: 5,
  },
  contractNumber: {
    fontSize: 9,
    color: '#666666',
    marginTop: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    color: '#DC2626',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333333',
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 700,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
    borderTop: '1pt solid #cccccc',
    borderBottom: '1pt solid #cccccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #eeeeee',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 700,
  },
  tableCol1: {
    width: '50%',
    paddingLeft: 8,
  },
  tableCol2: {
    width: '15%',
    textAlign: 'center',
  },
  tableCol3: {
    width: '15%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 8,
  },
  totalRow: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 700,
    color: '#DC2626',
    textAlign: 'right',
  },
  signatureBox: {
    marginTop: 40,
    padding: 15,
    borderTop: '2pt solid #DC2626',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
  },
  signatureField: {
    width: '45%',
    borderTop: '1pt solid #333333',
    paddingTop: 5,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTop: '1pt solid #eeeeee',
    paddingTop: 10,
  },
});

interface ContractData {
  contractNumber: string;
  projectNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  clientCnpj?: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  venueName?: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  teamMembers: Array<{
    category: string;
    quantity: number;
    dailyRate: number;
    durationDays: number;
    total: number;
  }>;
  equipment: Array<{
    name: string;
    category: string;
    quantity: number;
    durationDays: number;
    dailyRate: number;
    total: number;
  }>;
  totalTeam: number;
  totalEquipment: number;
  totalValue: number;
  paymentTerms?: string;
  specialClauses?: string;
  generatedAt: string;
}

export const ContractTemplate: React.FC<{ data: ContractData }> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>HRX EVENTOS</Text>
          <Text style={styles.text}>CNPJ: 00.000.000/0001-00</Text>
          <Text style={styles.text}>contato@hrxeventos.com.br | (21) 99995-2457</Text>
          <Text style={styles.contractNumber}>
            Contrato: {data.contractNumber} | Projeto: {data.projectNumber}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS PARA EVENTOS
        </Text>

        {/* Partes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. DAS PARTES</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>CONTRATANTE:</Text> {data.clientName}
            {data.clientCompany && `, representando ${data.clientCompany}`}
            {data.clientCnpj && ` (CNPJ: ${data.clientCnpj})`}
            {', inscrito no email '}
            {data.clientEmail}
            {data.clientPhone && `, telefone ${data.clientPhone}`}.
          </Text>
          <Text style={[styles.text, { marginTop: 8 }]}>
            <Text style={styles.bold}>CONTRATADA:</Text> HRX Eventos Ltda, CNPJ 00.000.000/0001-00,
            com sede na Cidade do Rio de Janeiro, especializada em prestação de serviços
            para eventos.
          </Text>
        </View>

        {/* Objeto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. DO OBJETO</Text>
          <Text style={styles.text}>
            O presente contrato tem por objeto a prestação de serviços de profissionais
            e fornecimento de equipamentos para o evento <Text style={styles.bold}>{data.eventName}</Text>,
            tipo {data.eventType}, a realizar-se em {formatDate(data.eventDate)},
            no endereço {data.venueAddress}, {data.venueCity}-{data.venueState}.
          </Text>
        </View>

        {/* Serviços - Equipe */}
        {data.teamMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. PROFISSIONAIS CONTRATADOS</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCol1}>Profissional</Text>
                <Text style={styles.tableCol2}>Qtd</Text>
                <Text style={styles.tableCol3}>Dias</Text>
                <Text style={styles.tableCol4}>Valor</Text>
              </View>
              {data.teamMembers.map((member, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCol1}>{member.category}</Text>
                  <Text style={styles.tableCol2}>{member.quantity}</Text>
                  <Text style={styles.tableCol3}>{member.durationDays}</Text>
                  <Text style={styles.tableCol4}>{formatCurrency(member.total)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalText}>
                  Subtotal Equipe: {formatCurrency(data.totalTeam)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Serviços - Equipamentos */}
        {data.equipment.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. EQUIPAMENTOS CONTRATADOS</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCol1}>Equipamento</Text>
                <Text style={styles.tableCol2}>Qtd</Text>
                <Text style={styles.tableCol3}>Dias</Text>
                <Text style={styles.tableCol4}>Valor</Text>
              </View>
              {data.equipment.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCol1}>{item.name}</Text>
                  <Text style={styles.tableCol2}>{item.quantity}</Text>
                  <Text style={styles.tableCol3}>{item.durationDays}</Text>
                  <Text style={styles.tableCol4}>{formatCurrency(item.total)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalText}>
                  Subtotal Equipamentos: {formatCurrency(data.totalEquipment)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Valor Total */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. DO VALOR</Text>
          <Text style={styles.text}>
            O valor total dos serviços contratados é de{' '}
            <Text style={styles.bold}>{formatCurrency(data.totalValue)}</Text>
            {data.paymentTerms && `, com as seguintes condições de pagamento: ${data.paymentTerms}`}.
          </Text>
        </View>

        {/* Cláusulas Especiais */}
        {data.specialClauses && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. CLÁUSULAS ESPECIAIS</Text>
            <Text style={styles.text}>{data.specialClauses}</Text>
          </View>
        )}

        {/* Termos Gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. DISPOSIÇÕES GERAIS</Text>
          <Text style={styles.text}>
            7.1. A CONTRATADA se compromete a fornecer profissionais qualificados e
            equipamentos em perfeito estado de funcionamento.
          </Text>
          <Text style={[styles.text, { marginTop: 5 }]}>
            7.2. O CONTRATANTE deve fornecer acesso ao local com antecedência mínima
            de 4 horas para montagem.
          </Text>
          <Text style={[styles.text, { marginTop: 5 }]}>
            7.3. Cancelamentos com menos de 7 dias de antecedência incorrem em multa
            de 30% do valor total.
          </Text>
          <Text style={[styles.text, { marginTop: 5 }]}>
            7.4. Este contrato é válido mediante assinatura digital das partes.
          </Text>
        </View>

        {/* Assinaturas */}
        <View style={styles.signatureBox}>
          <Text style={[styles.text, { textAlign: 'center', marginBottom: 5 }]}>
            Rio de Janeiro, {formatDate(data.generatedAt)}
          </Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureField}>
              <Text style={[styles.text, { fontSize: 9 }]}>CONTRATANTE</Text>
              <Text style={[styles.text, { fontSize: 8, marginTop: 3 }]}>
                {data.clientName}
              </Text>
            </View>
            <View style={styles.signatureField}>
              <Text style={[styles.text, { fontSize: 9 }]}>CONTRATADA</Text>
              <Text style={[styles.text, { fontSize: 8, marginTop: 3 }]}>
                HRX Eventos Ltda
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Documento gerado digitalmente em {formatDate(data.generatedAt)} às{' '}
            {new Date(data.generatedAt).toLocaleTimeString('pt-BR')}
          </Text>
          <Text style={{ marginTop: 3 }}>
            HRX Eventos - Plataforma de Profissionais para Eventos | www.hrxeventos.com.br
          </Text>
        </View>
      </Page>
    </Document>
  );
};
