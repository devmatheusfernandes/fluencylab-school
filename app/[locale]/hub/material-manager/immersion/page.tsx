"use client";

import { useState } from "react";
import { Header } from "@/components/ui/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mic,
  BookOpen,
  Headphones,
  Newspaper,
  ArrowRight,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WizardModal, WizardStep } from "@/components/ui/wizard";
import { cn } from "@/lib/utils";

export default function ImmersionManagerPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const items = [
    {
      title: "Podcasts",
      description:
        "Gerencie episódios de áudio, transcrições e exercícios de shadowing.",
      href: "/hub/material-manager/immersion/podcasts",
      icon: Mic,
      bgGradient: "from-blue-500/10 to-indigo-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "hover:border-blue-500/50",
      badge: "Listening",
    },
    {
      title: "Blogs & Artigos",
      description:
        "Gerencie textos, materiais de leitura e extração de vocabulário em contexto.",
      href: "/hub/material-manager/immersion/blogs",
      icon: BookOpen,
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "hover:border-emerald-500/50",
      badge: "Reading",
    },
  ];

  // Configuração do Wizard
  const wizardSteps: WizardStep[] = [
    {
      id: "intro",
      title: "Imersão",
      description: "O pilar da fluência.",
      icon: Sparkles,
      headerBg: "bg-indigo-100 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      content: (
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            A imersão é onde o aluno consome conteúdo real no idioma alvo. Aqui
            você gerencia os materiais que servirão de base para o estudo
            passivo e ativo.
          </p>
        </div>
      ),
    },
    {
      id: "podcasts",
      title: "Podcasts (Áudio)",
      description: "Treino de escuta.",
      icon: Headphones,
      headerBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      content: (
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Crie episódios de podcast com transcrições sincronizadas.</p>
          <ul className="text-left list-disc list-inside bg-muted/50 p-3 rounded-lg">
            <li>Geração automática de áudio via IA.</li>
            <li>Alinhamento de texto para Shadowing.</li>
            <li>Quizzes de compreensão auditiva.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "blogs",
      title: "Blogs (Texto)",
      description: "Treino de leitura.",
      icon: Newspaper,
      headerBg: "bg-emerald-100 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      content: (
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Artigos e textos autênticos para expandir o vocabulário.</p>
          <ul className="text-left list-disc list-inside bg-muted/50 p-3 rounded-lg">
            <li>Extração automática de keywords.</li>
            <li>Tradução contextual (hover).</li>
            <li>Perguntas de interpretação.</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="container-padding space-y-8 mx-auto">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <Header
          heading="Gestão de Imersão"
          subheading="Gerencie podcasts e blogs para imersão dos alunos."
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary mt-2"
          onClick={() => setIsWizardOpen(true)}
          title="O que é isso?"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="group h-full">
            <Card
              className={cn(
                "h-full transition-all duration-300 border-2 hover:shadow-lg relative overflow-hidden",
                item.borderColor,
              )}
            >
              {/* Background Gradient Effect */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br",
                  item.bgGradient,
                )}
              />

              <CardHeader className="relative pb-2">
                <div className="flex justify-between items-start">
                  <div
                    className={cn(
                      "p-4 rounded-2xl bg-muted/50 group-hover:bg-background/80 transition-colors shadow-sm",
                      item.iconColor,
                    )}
                  >
                    <item.icon className="h-8 w-8" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="pt-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {item.badge}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative">
                <CardDescription className="text-base leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Info Wizard */}
      <WizardModal
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        steps={wizardSteps}
        onComplete={() => setIsWizardOpen(false)}
        submitLabel="Entendi"
      />
    </div>
  );
}
