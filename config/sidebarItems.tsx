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
    icon: <UserCircle className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/dashboard",
    label: "Painel",
    icon: <Layers className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/users",
    label: "Usuários",
    icon: <Users className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/finances",
    label: "Financeiro",
    icon: <DollarSign className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/courses",
    label: "Cursos",
    icon: <Video className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/documents",
    label: "Documentos",
    icon: <FileText className="w-6 h-6" />,
  },
];

const teacherItems: SidebarItemType[] = [
  {
    href: "/hub/plataforma/teacher/meus-alunos",
    label: "Alunos",
    icon: <Users className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/teacher/calendario",
    label: "Minha Agenda",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/settings",
    label: "Configurações",
    icon: <Settings className="w-6 h-6" />,
  },
];

const studentItems: SidebarItemType[] = [
  {
    href: "/hub/plataforma/student/meu-perfil",
    label: "Meu Perfil",
    icon: <Home className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/student/caderno",
    label: "Caderno",
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/student/pratica",
    label: "Prática",
    icon: <Gamepad2 className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/student/my-class",
    label: "Calendário",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/courses",
    label: "Cursos",
    icon: <Monitor className="w-6 h-6" />,
  },
  {
    href: "/hub/plataforma/settings",
    label: "Configurações",
    icon: <Settings className="w-6 h-6" />,
  },
];

// Mapeia os papéis para suas respectivas listas de itens
export const sidebarItemsByRole: Record<string, SidebarItemType[]> = {
  [UserRoles.ADMIN]: adminItems,
  [UserRoles.TEACHER]: teacherItems,
  [UserRoles.STUDENT]: studentItems,
};
