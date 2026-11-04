"use client";

import { useState } from "react";
import { FileSignature, RefreshCw } from "lucide-react";
import type { Student } from "@/lib/demo-data";
import { brl } from "@/lib/format";
import { Badge, Button, Card, Explain, Modal, SectionHead, Switch } from "@/components/demo/ui";
import type { TeacherCtx } from "@/components/demo/teacher/types";

const VARIABLES = ["{{aluno.nome}}", "{{aluno.cpf}}", "{{escola.nome}}", "{{contrato.data}}", "{{plano.valor}}"];

export function Contracts({ ctx }: { ctx: TeacherCtx }) {
  const [renew, setRenew] = useState<Record<string, boolean>>(() => Object.fromEntries(ctx.students.map((s) => [s.id, s.autoRenew])));
  const [viewing, setViewing] = useState<Student | null>(null);

  return (
    <>
      <SectionHead title="Contratos" text="Contrato digital assinado dentro da plataforma, com renovação automática." />
      <Explain title="Como funciona a renovação">
        Você escreve um modelo uma vez, com campos que se preenchem sozinhos (nome do aluno, valor, data). O aluno assina
        online. Se a <b>renovação automática</b> estiver ligada, no vencimento a plataforma cria o novo contrato, assina
        com os dados do anterior e avisa o aluno por e-mail. Cancelamentos antes do fim do contrato podem ter uma taxa
        configurável (por exemplo, metade de uma mensalidade).
      </Explain>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-cream text-muted">
            <tr>
              {["Aluno", "Plano", "Vigência até", "Renovação automática", "Contrato"].map((h) => (
                <th key={h} className="px-4 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ctx.students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-bold">{s.name}</td>
                <td className="px-4 py-3 text-muted">{s.plan}</td>
                <td className="px-4 py-3">{s.contractUntil}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={renew[s.id] ?? false}
                      onChange={(value) => {
                        setRenew((r) => ({ ...r, [s.id]: value }));
                        ctx.notify(value ? `Renovação automática ligada para ${s.name.split(" ")[0]}` : `Renovação automática desligada para ${s.name.split(" ")[0]}`);
                      }}
                      label={`Renovação automática de ${s.name}`}
                    />
                    {renew[s.id] ? (
                      <Badge tone="ok">
                        <RefreshCw className="size-3" aria-hidden /> Renova
                      </Badge>
                    ) : (
                      <Badge>Encerra</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" onClick={() => setViewing(s)}>
                    Ver contrato
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Modelo de contrato</h3>
        <p className="mt-1 text-sm text-muted">Estes campos são preenchidos automaticamente para cada aluno:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <code key={v} className="rounded-lg bg-brand-soft px-2.5 py-1 text-sm font-bold">
              {v}
            </code>
          ))}
        </div>
      </Card>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Contrato de prestação de serviços" wide>
        {viewing && (
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              Pelo presente instrumento, <b>{viewing.name}</b> (CPF 000.000.000-00) contrata os serviços de aulas de idioma
              de <b>{ctx.brand.name}</b>, na modalidade <b>{viewing.plan}</b>, pelo valor mensal de <b>{brl(viewing.price)}</b>,
              com vencimento no dia <b>{viewing.dueDay}</b> de cada mês.
            </p>
            <p>O contrato vigora até {viewing.contractUntil} e {renew[viewing.id] ? "será renovado automaticamente" : "não será renovado automaticamente"}, conforme as condições acordadas entre as partes.</p>
            <p>O cancelamento antes do último mês do ciclo pode implicar taxa equivalente à metade de uma mensalidade.</p>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-brand bg-brand-soft p-4">
              <FileSignature className="size-6 shrink-0" aria-hidden />
              <div>
                <p className="font-bold">Assinado digitalmente por {viewing.name}</p>
                <p className="text-muted">Registro de data, hora e dispositivo guardado na plataforma (exemplo ilustrativo).</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
