import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CreditCard,
  FileText,
  Gamepad2,
  Library,
  Lock,
  Palette,
  PlayCircle,
  RefreshCw,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { WaitlistForm } from "@/components/site/WaitlistForm";
import { DOMAIN, PRICING, PRODUCT_NAME, SHOW_PRICING } from "@/lib/config";
import { brl } from "@/lib/format";

const pains = [
  { title: "Cobrar", text: "Lembrar aluno por aluno, mês a mês, e ainda ficar sem graça de cobrar." },
  { title: "Contratos", text: "Combinados por mensagem, sem renovação e sem registro do que foi acordado." },
  { title: "Aulas e material", text: "Link de chamada de um lado, PDFs de outro, anotações em outro." },
  { title: "Acompanhamento", text: "Saber onde cada aluno parou e o que precisa revisar." },
];

type Feature = { icon: LucideIcon; title: string; text: string; href: string };

const features: Feature[] = [
  {
    icon: CreditCard,
    title: "Cobrança automática",
    text: "A cobrança por PIX chega ao aluno antes do vencimento e o dinheiro cai direto na sua conta, com lembretes por e-mail, notificação e WhatsApp.",
    href: "/demo/professor?tab=cobrancas",
  },
  {
    icon: Lock,
    title: "Bloqueio por atraso",
    text: "Se a mensalidade atrasa, o acesso do aluno é suspenso sozinho e liberado assim que ele regulariza. Sem conversa desconfortável.",
    href: "/demo/professor?tab=alunos",
  },
  {
    icon: FileText,
    title: "Contratos e renovações",
    text: "Contrato digital assinado dentro da plataforma, com renovação automática e registro do que foi combinado.",
    href: "/demo/professor?tab=contratos",
  },
  {
    icon: Users,
    title: "Sala de aula colaborativa",
    text: "Caderno compartilhado e vídeo na mesma tela. Professor e aluno escrevem juntos e inserem quiz, lacunas e outras dinâmicas no documento.",
    href: "/demo/professor?tab=aulas",
  },
  {
    icon: Target,
    title: "Nivelamento e plano automático",
    text: "Na primeira aula o aluno faz um teste adaptativo. A plataforma monta o perfil dele e um plano de estudos com lições no nível certo.",
    href: "/demo/professor?tab=primeira",
  },
  {
    icon: Library,
    title: "Biblioteca e seus materiais",
    text: "Lições, cadernos e apostilas prontos, e a possibilidade de criar os seus, com revisão de qualidade por IA antes de chegar ao aluno.",
    href: "/demo/professor?tab=biblioteca",
  },
  {
    icon: Palette,
    title: "A sua marca",
    text: "Logo, cores, nome e endereço próprios. O aluno entra na sua escola, não em uma plataforma genérica.",
    href: "/demo/professor?tab=marca",
  },
  {
    icon: RefreshCw,
    title: "Revisão espaçada",
    text: "O aluno revisa o vocabulário no momento certo para não esquecer, e você acompanha a prática diária dele na página do aluno.",
    href: "/demo/professor?tab=alunos",
  },
  {
    icon: Gamepad2,
    title: "Jogos de imersão",
    text: "Wordle, Word Ladder e Lyrics Training para o aluno praticar o idioma de forma leve, todos os dias.",
    href: "/demo/aluno?tab=revisar",
  },
  {
    icon: PlayCircle,
    title: "Aulas gravadas",
    text: "Cada aula pode ficar gravada, com transcrição. O aluno revê o que foi dito e salva frases no caderno.",
    href: "/demo/aluno?tab=aulas",
  },
  {
    icon: Award,
    title: "Caderno e certificados",
    text: "Anotações das aulas organizadas e certificado de conclusão para cada curso finalizado.",
    href: "/demo/aluno?tab=estudar",
  },
];

const steps = [
  { n: "1", title: "Entre na lista", text: "Começamos por convite, com poucos professores. Quem entra na lista tem prioridade." },
  { n: "2", title: "Configure a sua escola", text: "Cadastre sua marca, seus planos e conecte a sua conta de recebimento." },
  { n: "3", title: "Convide seus alunos", text: "A plataforma cuida de contrato, cobrança, acesso e acompanhamento." },
];

const faqs = [
  {
    q: "Quando a plataforma abre?",
    a: "Estamos começando por convite, com um grupo pequeno de professores. A ordem da lista de espera define quem recebe o convite primeiro.",
  },
  {
    q: "O dinheiro dos alunos passa por vocês?",
    a: "A ideia é que não. O aluno paga direto na sua conta de recebimento, e você paga a mensalidade da plataforma.",
  },
  {
    q: "Preciso ter CNPJ?",
    a: "Depende do meio de pagamento que você usar para receber. Vamos orientar essa parte no processo de entrada.",
  },
  {
    q: "Posso usar com os alunos que já tenho?",
    a: "Sim. Você convida os seus alunos atuais e eles passam a ter contrato, cobrança e aulas no mesmo lugar.",
  },
  {
    q: "A plataforma já existe de verdade?",
    a: "Ela nasce de uma plataforma que já roda uma escola de idiomas online. As demos mostram como será a versão para professores independentes, com dados fictícios.",
  },
  {
    q: "Os meus dados e os dos meus alunos ficam seguros?",
    a: "Tratamos os dados conforme a LGPD. Veja a política de privacidade para os detalhes.",
  },
];

function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="rounded-3xl border border-line bg-card p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-teal font-display font-semibold text-white">A</span>
          <div>
            <p className="font-display font-semibold leading-tight">Inglês com a Ana</p>
            <p className="text-xs text-muted">ana.{DOMAIN}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            ["18", "alunos ativos"],
            ["R$ 5,4 mil", "recebido"],
            ["2", "em atraso"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-cream px-2 py-3">
              <p className="font-display text-lg font-semibold">{value}</p>
              <p className="text-[11px] text-muted">{label}</p>
            </div>
          ))}
        </div>
        <ul className="mt-5 space-y-2.5 text-sm">
          <li className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
            <span>Beatriz Lima</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Paga</span>
          </li>
          <li className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
            <span>Carlos Mendes</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">Vence em 3 dias</span>
          </li>
          <li className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
            <span>Eduardo Tavares</span>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">Acesso bloqueado</span>
          </li>
        </ul>
      </div>
      <div className="absolute -bottom-6 -left-4 flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-cream shadow-xl sm:-left-10">
        <Check className="size-4 text-amber" />
        PIX recebido e acesso liberado
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Lista de espera aberta</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              Você ensina. A plataforma cuida do resto.
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-muted">
              Contratos, cobrança, aulas em vídeo e acompanhamento do aluno em um só lugar, com a sua marca. Feita para
              professores de idiomas independentes.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="#lista" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink px-6 py-4 text-base font-bold text-cream transition hover:bg-ink-2 sm:text-lg">
                Entrar na lista de espera
                <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link href="/demo/professor" className="inline-flex items-center justify-center whitespace-nowrap rounded-full border-2 border-ink px-6 py-4 text-base font-bold transition hover:bg-ink hover:text-cream sm:text-lg">
                Ver a plataforma por dentro
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">Nasce de uma plataforma que já roda uma escola de idiomas online.</p>
          </div>
          <HeroMock />
        </section>

        {/* PROBLEMA */}
        <section className="bg-ink py-20 text-cream">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber">O problema</p>
            <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">Dar aula é a parte fácil.</h2>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {pains.map((p) => (
                <div key={p.title} className="rounded-3xl border border-white/10 bg-ink-2 p-7">
                  <h3 className="text-2xl font-semibold">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-cream/75">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RECURSOS */}
        <section id="recursos" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">O que a plataforma faz</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold sm:text-5xl">Tudo o que você usa para gerenciar a sua escola.</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">Clique em qualquer recurso para ver uma demonstração navegável, com explicações.</p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text, href }) => (
              <Link key={title} href={href} className="group flex flex-col rounded-3xl border border-line bg-card p-6 transition hover:-translate-y-1 hover:border-ink hover:shadow-lg">
                <span className="grid size-12 place-items-center rounded-2xl bg-cream text-teal">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-ink">
                  Ver na demo
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* DUAS VISÕES */}
        <section className="bg-card py-24">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-2">
            <div className="rounded-3xl bg-ink p-9 text-cream">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber">Para você, professor</p>
              <h3 className="mt-3 text-3xl font-semibold">Um painel para a sua escola</h3>
              <ul className="mt-6 space-y-3 text-cream/85">
                {["Alunos, contratos e cobranças no mesmo lugar", "Bloqueio automático por inadimplência", "Aulas em vídeo, agenda e biblioteca", "Sua marca, suas cores, seu endereço"].map((i) => (
                  <li key={i} className="flex gap-3">
                    <Check className="mt-1 size-4 shrink-0 text-amber" aria-hidden />
                    {i}
                  </li>
                ))}
              </ul>
              <Link href="/demo/professor" className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-bold text-ink hover:brightness-95">
                Abrir demo do professor <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="rounded-3xl border border-line bg-cream p-9">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Para o seu aluno</p>
              <h3 className="mt-3 text-3xl font-semibold">Um app simples de estudar</h3>
              <ul className="mt-6 space-y-3 text-ink/85">
                {["Próxima aula, agenda e reagendamento", "Cursos, exercícios e caderno de anotações", "Revisão de vocabulário no momento certo", "Mensalidade com PIX e contrato digital"].map((i) => (
                  <li key={i} className="flex gap-3">
                    <Check className="mt-1 size-4 shrink-0 text-teal" aria-hidden />
                    {i}
                  </li>
                ))}
              </ul>
              <Link href="/demo/aluno" className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-cream hover:bg-ink-2">
                Abrir demo do aluno <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="mx-auto max-w-6xl px-5 py-24">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Como funciona</p>
          <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">Três passos para começar.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-3xl border border-line bg-card p-8">
                <span className="grid size-12 place-items-center rounded-full bg-amber font-display text-xl font-semibold text-ink">{s.n}</span>
                <h3 className="mt-5 text-2xl font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DINHEIRO */}
        <section className="bg-amber py-20 text-ink">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em]">O dinheiro</p>
              <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">O aluno paga direto para você.</h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed">
                A mensalidade do aluno cai na sua conta de recebimento. Você paga à plataforma apenas pelo uso, sem
                comissão escondida sobre o seu trabalho.
              </p>
            </div>
            <div className="rounded-3xl bg-cream p-8">
              {SHOW_PRICING ? (
                <>
                  <p className="text-sm font-bold uppercase tracking-wider text-muted">Proposta inicial, em teste</p>
                  <div className="mt-4 flex flex-wrap gap-8">
                    <div>
                      <p className="font-display text-5xl font-semibold">{brl(PRICING.base)}</p>
                      <p className="mt-1 text-muted">por mês, mensalidade fixa</p>
                    </div>
                    <div>
                      <p className="font-display text-5xl font-semibold">{brl(PRICING.perStudent)}</p>
                      <p className="mt-1 text-muted">por aluno ativo, por mês</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-display text-3xl font-semibold">Preço de lançamento para quem entrar primeiro.</p>
                  <p className="mt-3 text-muted">
                    Os valores serão definidos com a ajuda dos professores da lista. Por isso a pergunta sobre quanto
                    você acharia justo pagar está no formulário.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* LISTA */}
        <section id="lista" className="mx-auto max-w-4xl scroll-mt-20 px-5 py-24">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Lista de espera</p>
            <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">Garanta a sua vaga.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
              Leva 2 minutos. Suas respostas moldam o produto e o preço. Críticas valem mais que elogios.
            </p>
          </div>
          <WaitlistForm />
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-24">
          <h2 className="text-4xl font-semibold">Dúvidas frequentes</h2>
          <div className="mt-8 divide-y divide-line rounded-3xl border border-line bg-card">
            {faqs.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                  {f.q}
                  <BookOpen className="size-5 shrink-0 text-muted transition group-open:rotate-12" aria-hidden />
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted">{PRODUCT_NAME} · telas das demos com dados fictícios</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
