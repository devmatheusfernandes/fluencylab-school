"use client";

import { motion } from "framer-motion";
import {
  ArrowUp,
  Instagram,
  MessageCircle,
  AtSign,
  ArrowRight,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="faq" className="container-padding pb-4 md:pb-0">
      {/* Ajuste de rounded para mobile (xl) e desktop (2rem) */}
      <div className="relative bg-slate-100 dark:bg-slate-900 rounded-3xl md:rounded-[2rem] overflow-hidden transition-all">
        {/* --- BACKGROUND TEXTURE (Sutil) --- */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>

        {/* Ajuste de padding vertical: py-8 no mobile, py-16 no desktop */}
        <div className="container mx-auto px-6 py-8 md:py-16 relative z-10">
          {/* --- CTA MINIMALISTA --- */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12 md:mb-16 md:px-4">
            <div className="space-y-3 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Pronto para fluência?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-md mx-auto lg:mx-0">
                Receba conteúdos exclusivos e novidades sobre o método natural.
              </p>
            </div>

            <div className="flex w-full max-w-md gap-2 flex-col sm:flex-row">
              <div className="relative w-full">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11 rounded-lg focus-visible:ring-primary/20 w-full"
                />
              </div>
              <Button className="h-11 px-8 rounded-lg font-medium shadow-none w-full sm:w-auto">
                Assinar
              </Button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800 mb-8 md:mb-12" />

          {/* --- LINKS (Grid Otimizado) --- */}
          {/* Mobile: grid-cols-2 (links lado a lado) */}
          {/* Desktop: Mantém estrutura original */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-x-4 gap-y-10 lg:gap-8 items-start">
            {/* Logo e Descrição - Ocupa 2 colunas no mobile (largura total) */}
            <div className="col-span-2 lg:col-span-4 space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-1.5 font-bold tracking-tighter text-xl text-slate-900 dark:text-white select-none">
                <span className="text-primary">FLUENCY</span>LAB
                <span className="text-slate-300">.</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
                Transformando o aprendizado de idiomas em uma experiência
                natural, humana e adaptada ao seu ritmo.
              </p>
            </div>

            {/* Colunas de Navegação */}
            <div className="col-span-1 lg:col-span-2 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Aluno
              </h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block py-1"
                  >
                    Validar certificado
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block py-1"
                  >
                    Remarcações
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block py-1"
                  >
                    Portal do Aluno
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-1 lg:col-span-2 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Sobre
              </h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block py-1"
                  >
                    Metodologia
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block py-1"
                  >
                    Carreiras
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block py-1"
                  >
                    Termos de Uso
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-1 lg:col-span-2 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Suporte
              </h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block py-1"
                  >
                    Fale Conosco
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block py-1"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Social - Alinha com a grade ou ocupa espaço próprio */}
            <div className="col-span-1 lg:col-span-2 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Social
              </h4>
              <div className="flex gap-2">
                <SocialButton href="#" color="bg-[#25D366]">
                  <MessageCircle className="w-4 h-4" />
                </SocialButton>
                <SocialButton
                  href="#"
                  color="bg-black dark:bg-white dark:text-black"
                >
                  <AtSign className="w-4 h-4" />
                </SocialButton>
                <SocialButton href="#" color="bg-[#E1306C]">
                  <Instagram className="w-4 h-4" />
                </SocialButton>
              </div>
            </div>
          </div>

          {/* --- BOTTOM BAR --- */}
          <div className="mt-12 md:mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-xs font-medium text-center md:text-left">
              © 2025 FluencyLab. Todos os direitos reservados.
            </p>

            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-primary transition-colors py-2 px-4 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Voltar ao topo
              <ArrowUp className="w-3 h-3 transition-transform group-hover:-translate-y-1" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Sub-componente mantido igual
function SocialButton({
  children,
  href,
  color,
}: {
  children: React.ReactNode;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm transition-all hover:scale-110 hover:shadow-md",
        color,
      )}
    >
      {children}
    </a>
  );
}
