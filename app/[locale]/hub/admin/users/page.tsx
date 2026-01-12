import UserManagementTable from "@/components/admin/UserManagementTable";
import { Header } from "@/components/ui/header";
import { useTranslations } from "next-intl";

export default function AdminUsersPage() {
  const t = useTranslations("AdminUsers");

  return (
    <div className="p-4 md:p-8 space-y-8">
      <Header
        heading={t("heading")}
        subheading={t("subheading")}
      />
      <UserManagementTable />
    </div>
  );
}