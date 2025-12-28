import React, { useEffect, useState } from "react";
import "@/components/contract/Contrato.css";

interface TeacherContractPDFProps {
  teacherName: string;
  teacherCnpj: string;
  teacherAddress?: string;
  teacherCity?: string;
  teacherState?: string;
  teacherZipCode?: string;
  signedDate?: string;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return "[Data]";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "[Data]";
  }
};

export const TeacherContractPDF: React.FC<TeacherContractPDFProps> = ({
  teacherName,
  teacherCnpj,
  teacherAddress = "[ENDEREÇO DO MEI]",
  teacherCity,
  teacherState,
  signedDate,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  //TODO: Get school name, CNPJ, and address from database 
  const schoolName = "Fluency Lab"; // Adjust if needed
  const schoolCNPJ = "47.603.142/0001-07"; // From student contract
  const schoolAddress = "Rua Vinte e Cinco de Julho, 20. Bairro Centro, Tunápolis - SC"; // From student contract

  return (
    <div
      className={`contract-container contract-print transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="no-scrollbar max-w-4xl mx-auto p-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none print:rounded-none print:p-0 transition-colors duration-300">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6 pb-4 border-b border-gray-300 dark:border-gray-600">
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INSTRUTORIA EDUCACIONAL E
          PARCERIA COMERCIAL
        </h1>

        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            IDENTIFICAÇÃO DAS PARTES
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>CONTRATANTE:</strong> {schoolName}, pessoa jurídica de
            direito privado, inscrita no CNPJ sob o nº {schoolCNPJ}, com sede em{" "}
            {schoolAddress}, neste ato representada na forma de seu Contrato
            Social.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>CONTRATADA:</strong> {teacherName}, pessoa jurídica de
            direito privado (MEI), inscrita no CNPJ sob o nº {teacherCnpj}, com
            sede em {teacherAddress}
            {teacherCity ? `, ${teacherCity}` : ""}
            {teacherState ? ` - ${teacherState}` : ""}.
          </p>
          <p className="mt-4 italic text-gray-700 dark:text-gray-300">
            As partes identificadas acima celebram o presente Contrato de
            Prestação de Serviços, regido pelo Código Civil Brasileiro (arts.
            593 a 609), Lei 13.429/2017 e demais cláusulas a seguir:
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA PRIMEIRA – DO OBJETO E NÃO EXCLUSIVIDADE
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>1.1.</strong> O objeto deste contrato é a prestação de
            serviços de instrutoria/tutoria na modalidade online pela CONTRATADA
            à CONTRATANTE.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>1.2.</strong> A prestação dos serviços dar-se-á sem
            exclusividade. A CONTRATADA declara-se livre para prestar serviços a
            outras empresas, concorrentes ou não, bem como gerir sua própria
            carteira de alunos particulares.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA SEGUNDA – DA AUTONOMIA TÉCNICA E OPERACIONAL
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>2.1.</strong> A CONTRATADA atuará com total autonomia
            técnica, não havendo subordinação jurídica ou hierárquica. Caberá à
            CONTRATADA definir as técnicas de ensino adequadas para atingir os
            objetivos pedagógicos propostos pelos materiais de apoio.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>2.2.</strong> A CONTRATADA não está sujeita a controle de
            jornada, ponto ou fiscalização de horários, comprometendo-se apenas
            com a entrega das sessões (aulas) nos dias e horários previamente
            aceitos por ela junto à coordenação de agendamento.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA TERCEIRA – DO ÔNUS DO EMPREENDIMENTO
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>3.1.</strong> A CONTRATADA assume integralmente os riscos e
            custos de sua atividade empresarial.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>3.2.</strong> É de responsabilidade exclusiva da CONTRATADA
            providenciar e manter a infraestrutura necessária para a prestação
            do serviço (computador, câmera, microfone, conexão de internet e
            ambiente físico adequado), não cabendo à CONTRATANTE o fornecimento
            ou ressarcimento de tais itens.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA QUARTA – DOS REQUISITOS TÉCNICOS DE QUALIDADE (SLA)
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>4.1.</strong> Visando garantir o padrão de qualidade
            comercial exigido pelos clientes da CONTRATANTE, a CONTRATADA
            obriga-se a cumprir os seguintes Requisitos Técnicos Objetivos
            durante as sessões:
          </p>
          <ul className="list-disc pl-6 mb-3 space-y-2">
            <li>
              <strong>a) Conectividade:</strong> Manter conexão estável de
              internet (mínimo sugerido de 50Mbps) e sistema de contingência em
              caso de queda;
            </li>
            <li>
              <strong>b) Áudio e Vídeo:</strong> Utilizar câmera de boa
              resolução (HD) e fones de ouvido com microfone para garantir a
              clareza da comunicação;
            </li>
            <li>
              <strong>c) Ambiente:</strong> Ministrar as aulas a partir de local
              silencioso, iluminado e com fundo neutro/profissional;
            </li>
            <li>
              <strong>d) Competência:</strong> Demonstrar domínio operacional da
              plataforma de ensino e proficiência no conteúdo lecionado.
            </li>
          </ul>
          <p className="mb-3 leading-relaxed">
            <strong>4.2.</strong> O não cumprimento reiterado destes requisitos
            técnicos, comprovado por reclamações de alunos ou falhas de
            transmissão, será considerado quebra de padrão de qualidade,
            passível de rescisão contratual.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA QUINTA – DA POSSIBILIDADE DE SUBSTITUIÇÃO (FIM DA
            PESSOALIDADE)
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>5.1.</strong> Sendo a contratação de natureza jurídica
            (empresa com empresa), a execução dos serviços não possui caráter
            personalíssimo.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>5.2.</strong> A CONTRATADA poderá designar prepostos, sócios
            ou contratar terceiros (substitutos) para ministrar as aulas em seus
            impedimentos ou conforme sua conveniência, sob sua exclusiva
            responsabilidade e pagamento.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>5.3.</strong> O substituto indicado deverá, obrigatoriamente,
            possuir a mesma qualificação técnica e cumprir os requisitos da
            Cláusula Quarta, reservando-se a CONTRATANTE o direito de recusar
            tecnicamente o serviço caso o substituto não demonstre aptidão para
            o ensino da metodologia.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA SEXTA – DA AGENDA E DIREITO DE RECUSA
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>6.1.</strong> A CONTRATANTE disponibilizará as oportunidades
            de aulas/turmas. A CONTRATADA possui o direito de aceitar ou recusar
            as demandas conforme sua disponibilidade, sem que a recusa gere
            qualquer penalidade.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>6.2.</strong> Uma vez aceita a agenda e confirmada com o
            aluno, a CONTRATADA compromete-se a honrar o compromisso comercial
            assumido.
          </p>
          <div className="pl-6 mb-3 space-y-2">
            <p className="mb-2">
              <strong>6.2.1. Cancelamentos pelo Aluno:</strong> Com menos de 24
              horas de antecedência, o valor da hora-aula será devido
              integralmente à CONTRATADA.
            </p>
            <p>
              <strong>6.2.2. Falha na Prestação (No-Show da Contratada):</strong>{" "}
              Em caso de ausência da CONTRATADA (ou seu preposto) sem aviso
              prévio ou por falha técnica, a hora não será paga. Caso a
              CONTRATANTE precise reembolsar o aluno ou conceder descontos
              devido à falha, este valor poderá ser debitado dos haveres da
              CONTRATADA a título de ressarcimento de danos.
            </p>
          </div>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA SÉTIMA – DO PREÇO E PAGAMENTO
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>7.1.</strong> O valor acordado é definido conforme tabela
            vigente por hora-aula efetivamente ministrada ou devida.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>7.2.</strong> O pagamento será realizado mensalmente até o
            dia 10 do mês subsequente, mediante apresentação obrigatória da Nota
            Fiscal de Serviços (NFS-e).
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>7.3.</strong> Os tributos incidentes sobre a prestação do
            serviço são de inteira responsabilidade da CONTRATADA.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA OITAVA – DA PROPRIEDADE INTELECTUAL E CONFIDENCIALIDADE
            (LGPD)
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>8.1.</strong> O material didático e o acesso à plataforma
            são licenças de uso temporário concedidas pela CONTRATANTE, vedada
            sua reprodução.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>8.2.</strong> A CONTRATADA compromete-se a tratar os dados
            pessoais dos alunos em conformidade com a Lei Geral de Proteção de
            Dados (LGPD), mantendo sigilo absoluto e utilizando-os apenas para
            fins educacionais.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA NONA – DA VIGÊNCIA E RESCISÃO
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>9.1.</strong> O contrato tem prazo indeterminado.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>9.2.</strong> Qualquer parte poderá rescindir o contrato
            mediante comunicação por escrito (e-mail) com 30 dias de
            antecedência.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>9.3.</strong> O descumprimento de cláusulas contratuais
            permite a rescisão imediata.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CLÁUSULA DÉCIMA – DO FORO
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>10.1.</strong> Fica eleito o foro da Comarca de Tunápolis/SC
            para dirimir questões oriundas deste contrato.
          </p>
        </section>

        <div className="mt-16 pt-8 border-t border-gray-300 dark:border-gray-600">
          <p className="text-center mb-12">
            Tunápolis, {signedDate ? formatDate(signedDate) : formatDate(new Date().toISOString())}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="text-center">
              <div className="mb-4 text-green-600 font-bold font-script text-2xl">
                Assinado Digitalmente
              </div>
              <div className="border-t border-gray-400 pt-2">
                <p className="font-bold">{schoolName}</p>
                <p className="text-sm">CONTRATANTE</p>
              </div>
            </div>

            <div className="text-center">
              {signedDate ? (
                 <div className="mb-4 text-blue-600 font-bold font-script text-2xl">
                   Assinado Digitalmente
                 </div>
              ) : (
                <div className="h-12 mb-4"></div>
              )}
              <div className="border-t border-gray-400 pt-2">
                <p className="font-bold">{teacherName || "____________________"}</p>
                <p className="text-sm">CONTRATADA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
