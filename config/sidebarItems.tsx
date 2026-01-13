// config/sidebarItems.tsx
import { SidebarItemType } from "@/components/shared/Sidebar/Sidebar";
import { UserRoles } from "@/types/users/userRoles";
import {
  Home,
  Users,
  Calendar,
  Settings,
  Layers,
  DollarSign,
  Video,
  BookOpen,
  Gamepad2,
  Monitor,
  UserCircle,
  UserStar,
  Book,
  BellDotIcon
} from "lucide-react";

// Define os links para cada papel
const adminItems: SidebarItemType[] = [
  {
    href: "/[locale]/hub/admin/my-profile",
    label: "Meu Perfil",
    labelKey: "myProfile",
    icon: <UserCircle className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/admin/users",
    label: "Usuários",
    labelKey: "users",
    icon: <Users className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/admin/finances",
    label: "Financeiro",
    labelKey: "finances",
    icon: <DollarSign className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/admin/courses",
    label: "Cursos",
    labelKey: "courses",
    icon: <Video className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/admin/notification",
    label: "Notificações",
    labelKey: "notification",
    icon: <BellDotIcon className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/admin/settings",
    label: "Configurações",
    labelKey: "settings",
    icon: <Settings className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/teacher/decks",
    label: "Decks",
    labelKey: "decks",
    icon: <Layers className="w-6 h-6" />,
  },
];

const teacherItems: SidebarItemType[] = [
  {
    href: "/[locale]/hub/teacher/my-profile",
    label: "Meu Perfil",
    labelKey: "myProfile",
    icon: <UserStar className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/teacher/my-students",
    label: "Alunos",
    labelKey: "students",
    icon: <Users className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/teacher/my-schedule",
    label: "Minha Agenda",
    labelKey: "mySchedule",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/teacher/workbooks",
    label: "Material",
    labelKey: "workbooks",
    icon: <Book className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/teacher/my-chat",
    label: "Conversas",
    labelKey: "chat",
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/teacher/settings",
    label: "Configurações",
    labelKey: "settings",
    icon: <Settings className="w-6 h-6" />,
  }
];

const studentItems: SidebarItemType[] = [
  {
    href: "/[locale]/hub/student/my-profile",
    label: "Meu Perfil",
    labelKey: "myProfile",
    icon: <Home className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/student/my-notebook",
    label: "Caderno",
    labelKey: "notebook",
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/student/my-practice",
    label: "Prática",
    labelKey: "practice",
    icon: <Gamepad2 className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/student/my-classes",
    label: "Calendário",
    labelKey: "calendar",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/student/my-courses",
    label: "Cursos",
    labelKey: "courses",
    icon: <Monitor className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/student/my-chat",
    label: "Conversas",
    labelKey: "chat",
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    href: "/[locale]/hub/student/settings",
    label: "Configurações",
    labelKey: "settings",
    icon: <Settings className="w-6 h-6" />,
  },
];

// Mapeia os papéis para suas respectivas listas de itens
export const sidebarItemsByRole: Record<string, SidebarItemType[]> = {
  [UserRoles.ADMIN]: adminItems,
  [UserRoles.MANAGER]: adminItems,
  [UserRoles.TEACHER]: teacherItems,
  [UserRoles.STUDENT]: studentItems,
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
  locale: string
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
