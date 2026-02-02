"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
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

  // Lógica de interação
  const handleMouseEnter = (index: number) => {
    // Só permite hover se não houver um item "travado" pelo clique
    // E detectamos se é dispositivo touch via CSS/JS media query na renderização,
    // mas aqui simplificamos: se tiver locked, ignora hover.
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
    // Se clicar no item já travado, destrava ele
    if (lockedIndex === index) {
      setLockedIndex(null);
      setActiveIndex(index); // Mantém aberto mas "destravado" (estado de hover)
    } else {
      // Trava o novo item
      setLockedIndex(index);
      setActiveIndex(index);
    }
  };

  return (
    <section className="py-12 bg-white dark:bg-slate-950">
      <div className="container px-4 mx-auto max-w-5xl">
        {/* Cabeçalho Minimalista como na foto */}
        <div className="flex items-baseline gap-2 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Como funciona
          </h2>
          <span className="text-2xl text-slate-300 dark:text-slate-700 font-light">
            +
          </span>
        </div>

        {/* Lista de Features */}
        <div className="flex flex-col">
          {features.map((feature, index) => {
            const isActive = activeIndex === index;
            const isLocked = lockedIndex === index;

            return (
              <motion.div
                key={index}
                initial={false}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(index)}
                animate={{
                  scale: isActive ? 1.02 : 1,
                  backgroundColor: isActive
                    ? "var(--bg-active)"
                    : "rgba(0,0,0,0)",
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "group relative cursor-pointer border-t border-slate-200 dark:border-slate-800 py-8 md:py-10 px-4 md:px-8 transition-colors",
                  // Definimos uma variável CSS local para a cor de fundo ativa (ajuste conforme seu tema)
                  "hover:z-10",
                  isActive
                    ? "border-transparent z-10 rounded-xl shadow-sm"
                    : "",
                )}
                style={{
                  // @ts-ignore
                  "--bg-active": "rgba(var(--primary-rgb), 0.03)", // Exemplo de uso sutil da cor primária no fundo
                }}
              >
                <div className="flex items-start justify-between gap-4 md:gap-8">
                  {/* Coluna 1: Número */}
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

                  {/* Coluna 2: Conteúdo */}
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

                    {/* Subtítulo (aparece sempre ou só quando fechado? Na ref parece limpo, vamos deixar o subtitle visivel sempre mas sutil) */}
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

                          {/* Botão de ação opcional dentro do card expandido */}
                          <div className="pt-4 flex items-center gap-2 text-primary font-medium text-sm">
                            <span>Saber mais</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Coluna 3: Ícone/Seta */}
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
          {/* Linha final para fechar a lista */}
          <div className="border-t border-slate-200 dark:border-slate-800" />
        </div>
      </div>
    </section>
  );
}
