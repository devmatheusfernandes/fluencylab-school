"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { BookOpen, Layers, Puzzle } from "lucide-react";

const flowSteps = [
  {
    icon: Puzzle,
    title: "Learning Components",
    description:
      "A base de tudo. Podem ser vocabulário (palavra) ou estruturas de frase (SVO, SOV). São os blocos fundamentais do aprendizado.",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: BookOpen,
    title: "Lessons (Aulas)",
    description:
      "Compostas pelos Learning Components. Incluem quizzes, dinâmicas, conteúdo explicativo e áudio (podcast). Variam em dificuldade, idioma e assunto.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    icon: Layers,
    title: "Planos de Aula",
    description:
      "Conjunto de aulas (Lessons). Podem ser personalizados para necessidades específicas ou padronizados como apostilas customizáveis.",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
];

export function MaterialFlowExplanation() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Fluxo de Criação de Material</h2>

      {/* Mobile View - Carousel */}
      <div className="block md:hidden px-2">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-sm mx-auto sm:max-w-md"
        >
          <CarouselContent>
            {flowSteps.map((step, index) => (
              <CarouselItem key={index} className="md:basis-1/2">
                <div className="p-1 h-full">
                  <Card className="h-full">
                    <CardHeader>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${step.bgColor}`}
                      >
                        <step.icon className={`w-6 h-6 ${step.color}`} />
                      </div>
                      <CardTitle>{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* Controles de navegação */}
          <div className="hidden sm:block">
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </div>
          {/* Indicador visual simples para mobile touch */}
          <div className="mt-4 text-center text-sm text-slate-400 sm:hidden">
            Deslize para ver mais →
          </div>
        </Carousel>
      </div>

      {/* Desktop View - Grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {flowSteps.map((step, index) => (
          <Card key={index} className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${step.bgColor}`}
              >
                <step.icon className={`w-6 h-6 ${step.color}`} />
              </div>
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
