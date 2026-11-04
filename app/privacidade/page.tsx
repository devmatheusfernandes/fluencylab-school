import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { CONTACT_EMAIL, PRODUCT_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-14 leading-relaxed">
        <h1 className="text-4xl font-semibold">Política de privacidade</h1>
        <p className="text-muted">
          Esta página explica como a {PRODUCT_NAME} trata os dados de quem entra na lista de espera. É um texto inicial
          para a fase de testes e será revisado antes do lançamento.
        </p>

        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Quais dados coletamos</h2>
          <p>
            Nome, e-mail, WhatsApp (opcional), idioma que você ensina, faixa de alunos, forma de cobrança atual, maior
            dificuldade, faixa de valor que você acharia justa, observações (opcional) e a origem do acesso (por exemplo, o
            link por onde você chegou).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Para que usamos</h2>
          <p>
            Para avisar você sobre o lançamento e convites, e para entender a demanda e o preço adequado. Não vendemos nem
            compartilhamos seus dados com terceiros para publicidade.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Onde ficam os dados</h2>
          <p>
            Em banco de dados de um provedor de nuvem contratado por nós, com acesso restrito. As demos exibem apenas
            dados fictícios, nenhum dado de aluno real aparece no site.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Seus direitos</h2>
          <p>
            Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento, conforme a Lei Geral de
            Proteção de Dados (LGPD).
            {CONTACT_EMAIL ? (
              <>
                {" "}
                Escreva para{" "}
                <a className="font-bold underline" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                .
              </>
            ) : null}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
