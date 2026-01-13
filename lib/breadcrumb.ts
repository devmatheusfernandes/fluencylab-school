// lib/breadcrumb.ts

interface BreadcrumbItem {
  label: string;
  href: string;
}

// Estrutura mínima de mensagens suportadas pelo i18n (next-intl)
interface BreadcrumbMessages {
  SidebarItems?: Record<string, string>;
  Breadcrumb?: Record<string, string>;
}

// Mapeia segmentos da URL para chaves em messages.SidebarItems
const segmentToSidebarKey: Record<string, string> = {
  dashboard: "dashboard",
  users: "users",
  finances: "finances",
  courses: "courses",
  documents: "documents",
  settings: "settings",
  "my-classes": "mySchedule",
  "my-class": "calendar",
  caderno: "notebook",
  pratica: "practice",
  profile: "myProfile",
  "my-profile": "myProfile",
  "my-students": "students",
  "meus-alunos": "students",
  "my-chat": "chat",
  "my-schedule": "mySchedule",
};

function capitalize(segment: string) {
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

// Função que gera os itens do breadcrumb a partir do pathname, com suporte a i18n
export const generateBreadcrumbs = (
  pathname: string,
  messages?: BreadcrumbMessages
): BreadcrumbItem[] => {
  const pathSegments = pathname.split("/").filter((segment) => segment);

  // Ignora prefixos comuns: locale, hub e plataforma
  const skip = new Set(["en", "pt", "hub", "plataforma"]);
  const startIndex = pathSegments.findIndex((segment) => !skip.has(segment));

  if (startIndex === -1) {
    return [{ label: "Início", href: "/hub" }];
  }

  const relevantSegments = pathSegments.slice(startIndex);
  let href = `/${pathSegments.slice(0, startIndex).join("/")}`;

  const tSidebar = messages?.SidebarItems ?? {};
  const tBreadcrumb = messages?.Breadcrumb ?? {};

  const breadcrumbs = relevantSegments.map((segment) => {
    href = `${href}/${segment}`;
    const key = segmentToSidebarKey[segment];
    const labelFromSidebar = key ? tSidebar[key] : undefined;
    const labelFromBreadcrumb = tBreadcrumb[segment];
    const label = labelFromSidebar ?? labelFromBreadcrumb ?? capitalize(segment);
    return { label, href };
  });

  // Adiciona o item 'Início' no começo (não é usado visualmente atualmente)
  return [{ label: "Início", href: "/hub" }, ...breadcrumbs];
};
