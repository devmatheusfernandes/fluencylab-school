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
  FileText,
  BookOpen,
  Gamepad2,
  Monitor,
  UserCircle,
} from "lucide-react";

// Define os links para cada papel
const adminItems: SidebarItemType[] = [
  {
    href: "/hub/plataforma/profile",
    label: "Meu Perfil",
    labelKey: "myProfile",
    icon: <UserCircle className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/dashboard",
    label: "Painel",
    labelKey: "dashboard",
    icon: <Layers className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/users",
    label: "Usuários",
    labelKey: "users",
    icon: <Users className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/finances",
    label: "Financeiro",
    labelKey: "finances",
    icon: <DollarSign className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/courses",
    label: "Cursos",
    labelKey: "courses",
    icon: <Video className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/documents",
    label: "Documentos",
    labelKey: "documents",
    icon: <FileText className="w-6 h-6" />,
  },
];

const teacherItems: SidebarItemType[] = [
  {
    href: "/hub/plataforma/teacher/meus-alunos",
    label: "Alunos",
    labelKey: "students",
    icon: <Users className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/teacher/calendario",
    label: "Minha Agenda",
    labelKey: "mySchedule",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/settings",
    label: "Configurações",
    labelKey: "settings",
    icon: <Settings className="w-6 h-6" />,
  },
];

const studentItems: SidebarItemType[] = [
  {
    href: "/hub/plataforma/student/meu-perfil",
    label: "Meu Perfil",
    labelKey: "myProfile",
    icon: <Home className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/student/caderno",
    label: "Caderno",
    labelKey: "notebook",
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/student/pratica",
    label: "Prática",
    labelKey: "practice",
    icon: <Gamepad2 className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/student/my-class",
    label: "Calendário",
    labelKey: "calendar",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/courses",
    label: "Cursos",
    labelKey: "courses",
    icon: <Monitor className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/settings",
    label: "Configurações",
    labelKey: "settings",
    icon: <Settings className="w-6 h-6" />,
  },
];

// Mapeia os papéis para suas respectivas listas de itens
export const sidebarItemsByRole: Record<string, SidebarItemType[]> = {
  [UserRoles.ADMIN]: adminItems,
  [UserRoles.TEACHER]: teacherItems,
  [UserRoles.STUDENT]: studentItems,
};
