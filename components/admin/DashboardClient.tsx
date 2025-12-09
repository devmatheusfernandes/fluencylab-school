"use client";

import StatCard from "./StatCard";
import { useCan } from "@/hooks/useCurrentUser";
// Importe os seus componentes de Gráfico e Tabela de Atividade aqui
// import RevenueChart from "./RevenueChart";
// import RecentActivityTable from "./RecentActivityTable";

export default function DashboardClient({
  data,
  icons,
}: {
  data: any;
  icons: any;
}) {
  // Hook para verificar se o utilizador pode ver dados financeiros
  const canViewFinances = useCan("payment.manage");

  return (
    <>
      {/* Secção 1: Métricas Chave */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card de Receita só aparece para quem tem permissão */}
        {canViewFinances && (
          <StatCard
            title="Receita (Mês)"
            value={`R$ ${data.monthlyRevenue.toFixed(2)}`}
            icon={icons.revenue}
            trend={data.revenueTrend}
          />
        )}
        <StatCard
          title="Novos Utilizadores (Mês)"
          value={`+${data.newUsersCount}`}
          icon={icons.newUsers}
        />
        <StatCard
          title="Aulas Agendadas (Hoje)"
          value={data.classesTodayCount}
          icon={icons.classesToday}
        />
        <StatCard
          title="Professores Ativos"
          value={data.activeTeachersCount}
          icon={icons.activeTeachers}
        />
      </div>

      {/* Secção 2: Visualização de Dados */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Receita só aparece para quem tem permissão */}
        {canViewFinances && (
          <div> {/* <RevenueChart data={data.revenueLast6Months} /> */} </div>
        )}
        <div> {/* Outro gráfico pode ser adicionado aqui */} </div>
      </div>

      {/* Secção 3: Atividade Recente */}
      <div>{/* <RecentActivityTable classes={data.recentClasses} /> */}</div>
    </>
  );
}
