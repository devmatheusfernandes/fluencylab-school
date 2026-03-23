"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "01",
    title: "Plano Personalizado",
    subtitle: "Seu cronograma, seus objetivos",
    description:
      "Não tem aula 'padrão' aqui. A gente monta um plano de estudos único pra você: baseado no seu nível atual, suas metas (viagem? trabalho? prova?), seus prazos, e até nos assuntos que você curte. Quer aprender inglês falando sobre tecnologia? Bora.",
  },
  {
    id: "02",
    title: "Método Natural",
    subtitle: "Aprenda sem decorar",
    description:
      "Sabe como você aprendeu português? Sem ficar decorando conjugação e listinha de vocabulário. Nosso método é o mesmo: você adquire o idioma naturalmente, através de conversas reais, contexto, e imersão. Nada de flashcards chatos.",
  },
  {
    id: "03",
    title: "Plataforma Completa",
    subtitle: "Veja seu progresso acontecendo",
    description:
      "Tudo que você aprende fica registrado na nossa plataforma: vocabulário dominado, tópicos estudados, evolução ao longo do tempo. Mais: tem videoaulas gravadas pra você revisar qualquer assunto quando quiser.",
  },
  {
    id: "04",
    title: "Tutores Dedicados",
    subtitle: "A gente não deixa você desistir",
    description:
      "Não é só 'marcar aula e tchau'. Seu tutor te conhece, lembra dos seus objetivos, ajusta o plano quando precisa, e faz um atendimento pensado para você continuar. É tipo ter um personal trainer do idioma.",
  },
];

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    if (lockedIndex === null) {
      setActiveIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (lockedIndex === null) {
      setActiveIndex(null);
    }
  };

  const handleClick = (index: number) => {
    if (lockedIndex === index) {
      setLockedIndex(null);
      setActiveIndex(null);
    } else {
      setLockedIndex(index);
      setActiveIndex(index);
    }
  };

  return (
    <section className="py-12">
      <div className="container px-4 mx-auto max-w-5xl">
        <div className="flex justify-center sm:justify-start items-baseline gap-2 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Como funciona
          </h2>
          <span className="text-2xl text-slate-300 dark:text-slate-700 font-light">
            +
          </span>
        </div>

        <div className="flex flex-col">
          {features.map((feature, index) => {
            const isActive = activeIndex === index;

            return (
              <motion.div
                key={index}
                initial={false}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(index)}
                animate={{
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "group relative cursor-pointer border-t border-slate-200 dark:border-slate-800 py-8 md:py-10 px-4 md:px-8 transition-colors duration-300",
                  "hover:z-10",
                  isActive
                    ? "border-transparent z-10 bg-[var(--bg-active)]"
                    : "bg-transparent",
                )}
                style={{
                  // @ts-expect-error - CSS variables are not recognized by TS
                  "--bg-active": "rgba(var(--primary-rgb), 0.03)",
                }}
              >
                <div className="flex items-start justify-between gap-4 md:gap-8">
                  <span
                    className={cn(
                      "text-sm font-mono transition-colors duration-300 mt-1",
                      isActive
                        ? "text-primary font-bold"
                        : "text-slate-400 dark:text-slate-600",
                    )}
                  >
                    {feature.id}
                  </span>

                  <div className="flex-1">
                    <h3
                      className={cn(
                        "text-xl md:text-3xl font-semibold transition-colors duration-300",
                        isActive
                          ? "text-primary"
                          : "text-slate-900 dark:text-slate-100",
                      )}
                    >
                      {feature.title}
                    </h3>

                    <p
                      className={cn(
                        "text-sm md:text-base transition-all duration-300 mt-1",
                        isActive ? "text-primary/80" : "text-slate-500",
                      )}
                    >
                      {feature.subtitle}
                    </p>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            marginTop: 16,
                          }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg max-w-2xl">
                            {feature.description}
                          </p>

                          <div className="pt-4 flex items-center gap-2 text-primary font-medium text-sm">
                            <span>Saber mais</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-end w-8">
                    <motion.div
                      animate={{ rotate: isActive ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isActive ? (
                        <ArrowRight className="w-5 h-5 text-primary" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 -rotate-45" />
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div className="border-t border-slate-200 dark:border-slate-800" />
        </div>
      </div>
    </section>
  );
}
