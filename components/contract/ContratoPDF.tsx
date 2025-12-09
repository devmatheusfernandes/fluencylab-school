import React, { useEffect } from "react";
import "./Contrato.css";
import { myFont } from "../fonts/fonts";
import { Student, ContractStatus } from "@/types/contract";

interface ContratoPDFProps {
  alunoData: Student | null;
  contractStatus: ContractStatus | null;
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "[Data Inválida]";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "[Data Inválida]";
  }
};

const formatShortDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR");
  } catch (e) {
    return "N/A";
  }
};

const ContratoPDF: React.FC<ContratoPDFProps> = ({
  alunoData,
  contractStatus,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    // Set visible after component mounts to trigger animation
    setIsVisible(true);
  }, []);

  if (!alunoData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-lg text-gray-500 dark:text-gray-400">
          Carregando dados do aluno...
        </div>
      </div>
    );
  }

  const studentName = alunoData.name || "___________";
  const studentCPF = alunoData.cpf || "___________";
  const contractSignedDate = formatDate(contractStatus?.signedAt);
  const studentSignedShortDate = formatShortDate(contractStatus?.signedAt);
  const adminSignedShortDate = formatShortDate(contractStatus?.adminSignedAt);

  return (
    <div className={`contract-container contract-print transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-4xl mx-auto p-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none print:rounded-none print:p-0 transition-colors duration-300">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-6 pb-4 border-b border-gray-300 dark:border-gray-600">
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS
        </h1>

        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DAS PARTES
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>CONTRATANTE:</strong> {studentName}, devidamente inscrito no
            CPF sob o nº {studentCPF}.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>CONTRATADA:</strong> Fluency Lab, com sede na Rua Vinte e
            Cinco de Julho, 20. Bairro Centro, Tunápolis - SC, inscrita no CNPJ
            sob nº 47.603.142/0001-07, neste ato representado por Matheus de
            Souza Fernandes, brasileiro, casado, empresário, carteira de
            identidade nº 706.251.811-58, CPF nº 706.251.811-58, residente e
            domiciliado à na Rua Vinte e Cinco de Julho, 20. Bairro Centro,
            Tunápolis - SC.
          </p>
          <p className="mt-4 italic text-gray-700 dark:text-gray-300">
            As partes acima acordam com o presente Contrato de Prestação de
            Serviços Educacionais, que se regerá pelas cláusulas seguintes:
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DO OBJETO DO CONTRATO
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 1ª.</strong> O OBJETO do presente instrumento é a
            prestação de serviços educacionais - aulas particulares de idioma,
            reforço escolar, acompanhamento escolar e demais atividades -
            voltadas às necessidades do CONTRATANTE.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo Primeiro:</strong> O Objeto específico deste
            contrato em particular é a prestação de serviço de aulas de idioma,
            escolhidas pelo CONTRATANTE na etapa de agendamento, e serão
            ministradas de forma semanal, na quantidade de vezes por semana
            escolhidas pelo CONTRATANTE, no horário escolhido pelo CONTRATANTE.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo Segundo:</strong> Todas as aulas serão ministradas
            de forma remota, on-line, por meio de programa a ser definido entre
            as partes.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DA OBRIGAÇÃO DA CONTRATADA
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 2ª.</strong> Está obrigada a CONTRATADA em fornecer
            ao aluno, o serviço de aulas particulares informado na etapa de
            agendamento, conforme descrito no Parágrafo único da Cláusula 1ª.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DA OBRIGAÇÃO DO CONTRATANTE
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 3ª.</strong> Está obrigado o CONTRATANTE em trazer
            para as aulas o material - livro, apostila, exercícios, etc. - cujo
            estudo esteja sendo realizado, cumprir com os horários e atividades
            extracurriculares.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo único.</strong> Em caso de não cumprimento desta
            cláusula a CONTRATADA não se responsabiliza pelo andamento e
            qualidade da aula.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DO PAGAMENTO
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 4ª.</strong> É obrigação do CONTRATANTE, efetuar o
            pagamento para a CONTRATADA, da quantia referente ao pacote de aulas
            selecionado.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 5ª.</strong> O pagamento deverá ser realizado no
            ato da contratação, por meio de débito, crédito ou transferência
            bancária.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo único.</strong> O pagamento deve ser realizado
            mensalmente, entre os dias 1º e 10º de cada mês, durante o período
            de validade deste contrato.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo único.</strong> Reajuste Anual: Uma vez por ano,
            no mês de julho, a mensalidade do contrato será sujeita a um
            reajuste de preço. O reajuste será calculado com base em índices
            econômicos relevantes e de acordo com as variações de mercado
            ocorridas desde o último reajuste. A CONTRATANTE será devidamente
            informada sobre o reajuste de preço com no mínimo um mês de
            antecedência à data efetiva do reajuste. A notificação será enviada
            por escrito, por meio de comunicação eletrônica, especificando a
            nova mensalidade calculada após o reajuste.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DA MARCAÇÃO DAS AULAS
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 6ª.</strong> O horário e regularidade semanal das
            aulas deve ser escolhida pelo CONTRATANTE de acordo com a
            disponibilidade. Todas as especificações da aula como: data, horário
            de início da aula e duração da aula, devem constar no formulário de
            agendamento.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo Único.</strong> O não cumprimento da Cláusula 6ª
            pode acarretar em um atraso no agendamento da aula.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 7ª.</strong> A marcação das aulas está diretamente
            vinculada à disponibilidade de horário dos professores/instrutores.
            Caso não haja essa disponibilidade do horário escolhido, o
            CONTRATANTE deverá escolher uma nova data para as aulas.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo Único.</strong> A preferência na disponibilidade
            do horário será dada pela ordem de recebimento dos pedidos de
            agendamento.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 8ª.</strong> Está obrigada a CONTRATADA a efetuar a
            marcação e agendamento das aulas em até 48 - quarenta e oito - horas
            após o recebimento do pedido.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DO DECORRER DAS AULAS
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 9ª.</strong> O CONTRATANTE se responsabiliza a
            proporcionar um ambiente adequado para as aulas, tratando com devido
            respeito o professor/instrutor designado à aula.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo Único.</strong> Em caso de não cumprimento da
            Cláusula 9ª, a CONTRATADA não se responsabiliza pelo andamento e
            qualidade da aula.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 10ª.</strong> A CONTRATADA se responsabiliza a
            proporcionar um ambiente adequado para as aulas, tratando com o
            devido respeito o aluno designado para a aula.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 11ª.</strong> As aulas serão realizadas através de
            videoconferência entre o professor/instrutor e o aluno.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo Único.</strong> Poderá haver mais de um
            instrutor/professor na aula com o aluno.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 12ª.</strong> A CONTRATADA não se responsabiliza
            pela qualidade da aula caso o CONTRATANTE não mantenha o ambiente de
            aula adequado para tal.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DA REMARCAÇÃO DAS AULAS
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 13ª.</strong> As aulas poderão ser remarcadas ou
            repostas tanto pelo CONTRATANTE duas vezes por mês, contudo, a mesma
            deve ocorrer mediante um aviso prévio de no mínimo 1 - um - dia.
            Essas aulas não acumulam para os meses seguintes.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo único.</strong> O CONTRATADO não tem a obrigação
            de avisar ou relembrar o aluno a respeito do horário de aula.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo único.</strong> A CONTRATADA dará margem de 15
            minutos de atraso para o CONTRATANTE, após esse tempo a CONTRATADA
            não tem mais obrigação de continuar, remarcar ou repor a aula
            daquele dia.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DA RESCISÃO
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 14ª.</strong> Este CONTRATO pode ser rescindido por
            qualquer das partes havendo aviso prévio de 15 dias úteis à parte
            contrária.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 15ª.</strong> Pode a CONTRATADA rescindir o
            presente contrato, após reunião interna do conselho, por
            indisciplina do aluno representado neste instrumento.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 16ª.</strong> Ocorrendo a rescisão, o aluno será
            desligado da Fluency Lab imediatamente.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 17ª.</strong> Ocorrendo rescisão por parte do
            CONTRATANTE, ele pagará uma taxa de 50% do valor total da
            mensalidade seguinte.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            DO PRAZO
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 18ª.</strong> Este contrato tem duração de 06
            meses, contando-se a partir da efetivação da compra e podendo ser
            prorrogado por comum acordo de ambas as partes.
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            CONDIÇÕES GERAIS
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 19ª.</strong> Fica condicionada a validade deste
            contrato à matrícula regular do aluno.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 20ª.</strong> A não frequência do aluno nas aulas
            não exime a CONTRATANTE do pagamento da aula à CONTRATADA.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Cláusula 21ª.</strong> A CONTRATADA se coloca no direito a
            três semanas de recesso durante o ano, podendo elas serem tiradas
            seguidas ou divididas em 1 semana cada. Não interferindo no
            pagamento mensal das aulas.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo único.</strong> A CONTRATADA é obrigada a avisar
            com antecedência de 1 mês a respeito do recesso e fornecer conteúdo
            para todos os alunos durante o período de recesso.
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>Parágrafo único.</strong> Aulas contratadas em um mês já
            corrente dão ao aluno direito de aulas extras equivalentes ao número
            de aulas já passadas a partir da primeira aula dada. Essas aulas
            podem ser feitas de uma vez ou progressivamente.
          </p>
        </section>

        {/* Signature Section */}
        <div className="border-t border-gray-300 dark:border-gray-600 my-8"></div>
        <p className="text-center mb-8 text-gray-700 dark:text-gray-300">
          Tunápolis - SC, {contractSignedDate}
        </p>

        <div className="signature-section flex flex-col md:flex-row justify-between mt-10 space-y-8 md:space-y-0 md:space-x-8 print:mt-16">
          <div className="flex-1 text-center">
            <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-all hover:border-blue-500 hover:scale-[1.01]">
              <p
                className={`${myFont.className} antialiased text-xl text-gray-900 dark:text-white`}
              >
                {studentName}
              </p>
            </div>
            <p className="mt-4 font-medium">{studentName}</p>
            {contractStatus?.signed && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                (Assinado eletronicamente em {studentSignedShortDate})
              </p>
            )}
          </div>

          <div className="flex-1 text-center">
            <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-all hover:border-blue-500 hover:scale-[1.01]">
              <p
                className={`${myFont.className} antialiased text-xl text-gray-900 dark:text-white`}
              >
                Matheus de Souza Fernandes
              </p>
            </div>
            <p className="mt-4 font-medium">Matheus de Souza Fernandes</p>
            {contractStatus?.signedByAdmin && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                (Assinado eletronicamente em {adminSignedShortDate})
              </p>
            )}
          </div>
        </div>

        {contractStatus?.logId && (
          <div className="mt-10 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Log ID: {contractStatus.logId} | Gerado em:{" "}
              {new Date().toLocaleString("pt-BR")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContratoPDF;