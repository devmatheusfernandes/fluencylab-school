// config/sidebarItems.tsx
import { SidebarItemType } from "@/components/shared/Sidebar/Sidebar";
import BrandLmStudioIcon from "@/public/animated/brand-lmstudio";
import { CalendarDaysIcon } from "@/public/animated/calendar";
import { CircleCheckIcon } from "@/public/animated/circle-check";
import { DollarSignIcon } from "@/public/animated/finances";
import LayersIcon from "@/public/animated/layers-icon";
import LayoutDashboardIcon from "@/public/animated/layout-dashboard-icon";
import { BookTextIcon } from "@/public/animated/lesson";
import { MessageSquareIcon } from "@/public/animated/message-square";
import { LayoutPanelTopIcon } from "@/public/animated/notebook";
import { BellIcon } from "@/public/animated/notification";
import { PeopleIcon } from "@/public/animated/people";
import { UserIcon } from "@/public/animated/person";
import { SettingsIcon } from "@/public/animated/settings";
import { ClapIcon } from "@/public/animated/video";
import { WavesLadderIcon } from "@/public/animated/waves-ladder";
import { UserRoles } from "@/types/users/userRoles";

// Define os links para cada papel
const adminItems: SidebarItemType[] = [
  {
    href: "/[locale]/hub/admin/my-profile",
    label: "Meu Perfil",
    labelKey: "myProfile",
    Icon: UserIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/admin/dashboard",
    label: "Dashboard",
    labelKey: "dashboard",
    Icon: LayoutDashboardIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/admin/users",
    label: "Usuários",
    labelKey: "users",
    Icon: PeopleIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/admin/finances",
    label: "Financeiro",
    labelKey: "finances",
    Icon: DollarSignIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/admin/courses",
    label: "Cursos",
    labelKey: "courses",
    Icon: ClapIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/admin/notification",
    label: "Notificações",
    labelKey: "notifications",
    Icon: BellIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/admin/tasks",
    label: "Tarefas",
    labelKey: "tasks",
    Icon: CircleCheckIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/admin/settings",
    label: "Configurações",
    labelKey: "settings",
    Icon: SettingsIcon,
    iconProps: { size: 20 },
  },
];

const teacherItems: SidebarItemType[] = [
  {
    href: "/[locale]/hub/teacher/my-profile",
    label: "Meu Perfil",
    labelKey: "myProfile",
    Icon: UserIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/teacher/my-students",
    label: "Alunos",
    labelKey: "students",
    Icon: PeopleIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/teacher/my-schedule",
    label: "Minha Agenda",
    labelKey: "mySchedule",
    Icon: CalendarDaysIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/teacher/workbooks",
    label: "Material",
    labelKey: "workbooks",
    Icon: LayoutDashboardIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/teacher/my-chat",
    label: "Conversas",
    labelKey: "chat",
    Icon: MessageSquareIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/teacher/settings",
    label: "Configurações",
    labelKey: "settings",
    Icon: SettingsIcon,
    iconProps: { size: 20 },
  },
];

const studentItems: SidebarItemType[] = [
  {
    href: "/[locale]/hub/student/my-profile",
    label: "Meu Perfil",
    labelKey: "myProfile",
    Icon: UserIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/student/my-notebook",
    label: "Caderno",
    labelKey: "notebook",
    Icon: LayoutPanelTopIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/student/my-classes",
    label: "Calendário",
    labelKey: "calendar",
    Icon: CalendarDaysIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/student/my-courses",
    label: "Cursos",
    labelKey: "courses",
    Icon: ClapIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/student/my-immersion",
    label: "Imersão",
    labelKey: "immersion",
    Icon: WavesLadderIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/student/my-chat",
    label: "Conversas",
    labelKey: "chat",
    Icon: MessageSquareIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/student/settings",
    label: "Configurações",
    labelKey: "settings",
    Icon: SettingsIcon,
    iconProps: { size: 20 },
  },
];

const managerItems = [
  {
    href: "/[locale]/hub/manager/my-profile",
    label: "Meu Perfil",
    labelKey: "myProfile",
    Icon: UserIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/manager/students",
    label: "Estudantes",
    labelKey: "students",
    Icon: PeopleIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/manager/tasks",
    label: "Tarefas",
    labelKey: "tasks",
    Icon: CircleCheckIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/manager/settings",
    label: "Configurações",
    labelKey: "settings",
    Icon: SettingsIcon,
    iconProps: { size: 20 },
  },
];

const materialManagerItems = [
  {
    href: "/[locale]/hub/material-manager/my-profile",
    label: "Meu Perfil",
    labelKey: "myProfile",
    Icon: UserIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/material-manager/lessons",
    label: "Lessons",
    labelKey: "lessons",
    Icon: BrandLmStudioIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/material-manager/plans",
    label: "Plans",
    labelKey: "plans",
    Icon: LayersIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/material-manager/components",
    label: "Components",
    labelKey: "components",
    Icon: LayoutPanelTopIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/material-manager/immersion",
    label: "Imersão",
    labelKey: "immersion",
    Icon: WavesLadderIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/material-manager/tasks",
    label: "Tarefas",
    labelKey: "tasks",
    Icon: CircleCheckIcon,
    iconProps: { size: 20 },
  },
  {
    href: "/[locale]/hub/material-manager/settings",
    label: "Configurações",
    labelKey: "settings",
    Icon: SettingsIcon,
    iconProps: { size: 20 },
  },
];

// Mapeia os papéis para suas respectivas listas de itens
export const sidebarItemsByRole: Record<string, SidebarItemType[]> = {
  [UserRoles.ADMIN]: adminItems,
  [UserRoles.MANAGER]: managerItems,
  [UserRoles.TEACHER]: teacherItems,
  [UserRoles.STUDENT]: studentItems,
  [UserRoles.GUARDED_STUDENT]: studentItems,
  [UserRoles.MATERIAL_MANAGER]: materialManagerItems,
};

// Helper to build locale-aware hrefs
function buildHrefWithLocale(href: string, locale: string): string {
  if (!href) return href;
  // Replace explicit [locale] placeholder when present
  if (href.startsWith("/[locale]")) {
    return href.replace("/[locale]", `/${locale}`);
  }
  // Prefix root-based paths with locale
  if (href.startsWith("/")) {
    return `/${locale}${href}`;
  }
  // Leave relative or external URLs untouched
  return href;
}

// Public API: get items by role with locale-aware hrefs
export function getSidebarItemsByRole(
  role: UserRoles | string,
  locale: string,
): SidebarItemType[] {
  const raw = sidebarItemsByRole[role] || [];
  return raw.map((it) => ({
    ...it,
    href: buildHrefWithLocale(it.href, locale),
    subItems: it.subItems
      ? it.subItems.map((sub) => ({
          ...sub,
          href: buildHrefWithLocale(sub.href, locale),
        }))
      : undefined,
  }));
}
