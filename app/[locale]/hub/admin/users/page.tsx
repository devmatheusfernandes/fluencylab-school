import UserManagementTable from "@/components/admin/UserManagementTable";
import { Header } from "@/components/ui/header";

export default function AdminUsersPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <Header
        heading="Usuários"
        subheading="Gerencie os usuários do sistema."
        headingSize="3xl"
      />
      <UserManagementTable />
    </div>
  );
}