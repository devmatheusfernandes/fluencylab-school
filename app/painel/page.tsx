import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { computeStats, listWaitlist } from "@/lib/waitlist";
import { MAIN_PAINS, PRICE_INTENTS } from "@/lib/waitlist-options";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

function Bars({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className="rounded-3xl border border-line bg-card p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((i) => (
          <li key={i.label}>
            <div className="flex justify-between text-sm">
              <span>{i.label}</span>
              <span className="font-bold">{i.count}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-cream">
              <div className="h-2 rounded-full bg-teal" style={{ width: `${(i.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!isAdmin(key)) notFound();

  const rows = await listWaitlist();
  if (!rows) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-3xl font-semibold">Painel</h1>
        <p className="mt-4 rounded-2xl bg-amber/20 p-5">
          O banco de dados ainda não está configurado. Defina a variável <code>WAITLIST_DATABASE_URL</code> na Vercel.
        </p>
      </main>
    );
  }

  const stats = computeStats(rows);
  const pct = (n: number) => (stats.total ? Math.round((n / stats.total) * 100) : 0);
  const painLabel = (v: string) => MAIN_PAINS.find((o) => o.value === v)?.label ?? v;
  const priceLabel = (v: string) => PRICE_INTENTS.find((o) => o.value === v)?.label ?? v;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Painel da lista de espera</h1>
          <p className="mt-1 text-muted">Use isto para decidir se a ideia tem demanda e a quanto.</p>
        </div>
        <a
          href={`/api/waitlist/export?key=${encodeURIComponent(key ?? "")}`}
          className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream hover:bg-ink-2"
        >
          Baixar CSV
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pessoas na lista", value: String(stats.total) },
          { label: "Pagariam algum valor", value: `${stats.willPay} (${pct(stats.willPay)}%)` },
          { label: "Pagariam R$ 100 ou mais", value: `${stats.willPay100} (${pct(stats.willPay100)}%)` },
          { label: "Valor médio que pagariam", value: stats.averageIntent ? `R$ ${stats.averageIntent}` : "-" },
        ].map((k) => (
          <div key={k.label} className="rounded-3xl border border-line bg-card p-6">
            <p className="text-sm text-muted">{k.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{k.value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">
        O valor médio usa o ponto central de cada faixa escolhida e ignora quem respondeu que não pagaria. Com poucas
        respostas, trate os números como indício, não como prova.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Bars title="Quanto acham justo pagar" items={stats.byPrice} />
        <Bars title="O que mais atrapalha hoje" items={stats.byPain} />
        <Bars title="Quantos alunos têm" items={stats.byStudents} />
        <Bars title="Idiomas" items={stats.byLanguage} />
      </div>

      <section className="overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-line bg-cream text-muted">
            <tr>
              {["Quando", "Nome", "E-mail", "WhatsApp", "Idioma", "Alunos", "Valor", "Dor principal", "Observações"].map((h) => (
                <th key={h} className="px-4 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3">{r.created_at}</td>
                <td className="px-4 py-3 font-semibold">{r.name}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="whitespace-nowrap px-4 py-3">{r.whatsapp ?? "-"}</td>
                <td className="px-4 py-3">{r.language}</td>
                <td className="px-4 py-3">{r.students_range}</td>
                <td className="whitespace-nowrap px-4 py-3">{priceLabel(r.price_intent)}</td>
                <td className="px-4 py-3">{painLabel(r.main_pain)}</td>
                <td className="max-w-xs px-4 py-3 text-muted">{r.notes ?? ""}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted">
                  Ninguém na lista ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
