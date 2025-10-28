// lib/breadcrumb.ts

interface BreadcrumbItem {
  label: string;
  href: string;
}

// Mapeamento para traduzir segmentos da URL para nomes amigáveis
const breadcrumbNameMap: { [key: string]: string } = {
  hub: "Início",
  plataforma: "Plataforma",
  admin: "Admin",
  teacher: "Professor",
  student: "Aluno",
  "my-classes": "Minhas Aulas",
  settings: "Configurações",
  schedule: "Agendar Aula",
  dashboard: "Painel",
  profile: "Perfil",
  users: "Usuários",
  finances: "Financeiro",
  courses: "Cursos",
  documents: "Documentos",
  "meus-alunos": "Meus Alunos",
  "meu-perfil": "Meu Perfil",
  caderno: "Caderno",
  pratica: "Prática",
  "my-class": "Calendário",
};

// Função que gera os itens do breadcrumb a partir do pathname
export const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const pathSegments = pathname.split("/").filter((segment) => segment);

  // Remove o 'hub' e 'plataforma' da exibição, começando pelo primeiro item real
  const startIndex = pathSegments.findIndex(
    (segment) => segment !== "hub" && segment !== "plataforma"
  );

  if (startIndex === -1) {
    return [{ label: "Início", href: "/hub" }];
  }

  const relevantSegments = pathSegments.slice(startIndex);
  let href = `/${pathSegments.slice(0, startIndex).join("/")}`;

  const breadcrumbs = relevantSegments.map((segment) => {
    href = `${href}/${segment}`;
    const label =
      breadcrumbNameMap[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    return { label, href };
  });

  // Adiciona o item 'Início' no começo
  return [{ label: "Início", href: "/hub" }, ...breadcrumbs];
};
