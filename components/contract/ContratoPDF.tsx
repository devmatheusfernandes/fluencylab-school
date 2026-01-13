import React, { useEffect } from "react";
import "./Contrato.css";
import { myFont } from "../fonts/fonts";
import { Student, ContractStatus } from "@/types/contract";
import { useTranslations, useLocale } from "next-intl";

interface ContratoPDFProps {
  alunoData: Student | null;
  contractStatus: ContractStatus | null;
}

const ContratoPDF: React.FC<ContratoPDFProps> = ({
  alunoData,
  contractStatus,
}) => {
  const t = useTranslations("ContractPDF");
  const locale = useLocale();
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    // Set visible after component mounts to trigger animation
    setIsVisible(true);
  }, []);

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "___________";
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "___________";
    }
  };

  const formatShortDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(locale);
    } catch (e) {
      return "N/A";
    }
  };

  if (!alunoData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-lg text-gray-500 dark:text-gray-400">
          {t("loading")}
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
          {t("title")}
        </h1>

        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("partiesTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("contractor")}</strong> {t("contractorDesc", { name: studentName, cpf: studentCPF })}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("hired")}</strong> {t("hiredDesc")}
          </p>
          <p className="mt-4 italic text-gray-700 dark:text-gray-300">
            {t("agreementText")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("objectTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause1")}</strong> {t("clause1Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("par1")}</strong> {t("par1Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("par2")}</strong> {t("par2Text")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("obligationHiredTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause2")}</strong> {t("clause2Text")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("obligationContractorTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause3")}</strong> {t("clause3Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("parUniqueText")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("paymentTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause4")}</strong> {t("clause4Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause5")}</strong> {t("clause5Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("paymentPar1Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("paymentPar2Text")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("schedulingTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause6")}</strong> {t("clause6Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("schedulingPar1Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause7")}</strong> {t("clause7Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("schedulingPar2Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause8")}</strong> {t("clause8Text")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("duringClassesTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause9")}</strong> {t("clause9Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("duringClassesPar1Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause10")}</strong> {t("clause10Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause11")}</strong> {t("clause11Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("duringClassesPar2Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause12")}</strong> {t("clause12Text")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("reschedulingTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause13")}</strong> {t("clause13Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("reschedulingPar1Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("reschedulingPar2Text")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("terminationTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause14")}</strong> {t("clause14Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause15")}</strong> {t("clause15Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause16")}</strong> {t("clause16Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause17")}</strong> {t("clause17Text")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("termTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause18")}</strong> {t("clause18Text")}
          </p>
        </section>

        <section className="mb-8 animate-fade-up">
          <h2 className="text-lg md:text-xl font-semibold mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            {t("generalConditionsTitle")}
          </h2>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause19")}</strong> {t("clause19Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause20")}</strong> {t("clause20Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("clause21")}</strong> {t("clause21Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("generalConditionsPar1Text")}
          </p>
          <p className="mb-3 leading-relaxed">
            <strong>{t("parUnique")}</strong> {t("generalConditionsPar2Text")}
          </p>
        </section>

        {/* Signature Section */}
        <div className="border-t border-gray-300 dark:border-gray-600 my-8"></div>
        <p className="text-center mb-8 text-gray-700 dark:text-gray-300">
          {t("cityDate", { date: contractSignedDate })}
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
              {t("signedElectronically", { date: studentSignedShortDate })}
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
              {t("signedElectronically", { date: adminSignedShortDate })}
            </p>
          )}
        </div>
      </div>

      {contractStatus?.logId && (
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("logId", { id: contractStatus.logId, date: new Date().toLocaleString(locale) })}
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default ContratoPDF;