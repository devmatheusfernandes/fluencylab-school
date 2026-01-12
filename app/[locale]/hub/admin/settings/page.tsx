import SettingsPage from "@/components/shared/Hub/Settings";
import { Header } from "@/components/ui/header";

export default function Settings() {
  return (
    <div className="flex flex-col">
      <div className="px-4 md:px-6 pt-6 pb-2">
        <Header
          heading="Configurações"
          subheading="Gerencie suas preferências de conta e sistema."
        />
      </div>
      <SettingsPage />
    </div>
  );
}
