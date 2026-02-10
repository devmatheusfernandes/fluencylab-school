The wizard componente should be used everytime a onboarding should be created or the user wants to create a helpful flow on how a page works

import { WizardModal, WizardStep } from "@/components/ui/wizard";
import { User, Mail } from "lucide-react";

export function ExemploWizard() {
const [open, setOpen] = useState(false);

const steps: WizardStep[] = [
{
id: "step-1",
title: "Passo 1",
description: "Descrição do passo 1",
icon: User,
headerBg: "bg-blue-100",
iconColor: "text-blue-600",
content: <div>Conteúdo do formulário aqui</div>
},
{
id: "step-2",
title: "Passo 2",
icon: Mail,
headerBg: "bg-green-100",
iconColor: "text-green-600",
content: <div>Outro conteúdo</div>
}
];

return (
<WizardModal
open={open}
onOpenChange={setOpen}
steps={steps}
onComplete={() => console.log("Finalizado")}
/>
);
}

de preferencia coloque ele no componente <Header /> de cada pagina, tanto o button normal coomo no breadcrum actions:

 <Header
        heading={t("title")}
        subheading={t("description")}
        icon={
          <>
            <div className="flex flex-row items-center gap-2">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" /> {t("newLesson")}
              </Button>
              <Button
                variant="glass"
                size="icon"
                onClick={() => setIsWizardOpen(true)}
                title="Como funciona?"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
            </div>

            <BreadcrumbActions>
              <BreadcrumbActionIcon
                onClick={() => setIsCreateOpen(true)}
                icon={Plus}
              />

              <BreadcrumbActionIcon
                onClick={() => setIsWizardOpen(true)}
                icon={HelpCircle}
              />
            </BreadcrumbActions>
          </>
        }
      />
