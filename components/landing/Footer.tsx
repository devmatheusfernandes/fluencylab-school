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
    <footer className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
      <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        {/* --- BACKGROUND TEXTURE (Sutil) --- */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>

        <div className="container mx-auto px-6 py-16 relative z-10">
          {/* --- CTA MINIMALISTA --- */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 md:px-8">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Pronto para fluência?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-md">
                Receba conteúdos exclusivos e novidades sobre o método natural.
              </p>
            </div>

            <div className="flex w-full max-w-sm gap-2">
              <div className="relative w-full">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11 rounded-lg focus-visible:ring-primary/20"
                />
              </div>
              <Button className="h-11 px-6 rounded-lg font-medium shadow-none">
                Assinar
              </Button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800 mb-12" />

          {/* --- LINKS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
            {/* Logo e Descrição */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-1.5 font-bold tracking-tighter text-xl text-slate-900 dark:text-white select-none">
                <span className="text-primary">FLUENCY</span>LAB
                <span className="text-slate-300">.</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                Transformando o aprendizado de idiomas em uma experiência
                natural, humana e adaptada ao seu ritmo.
              </p>
            </div>

            {/* Colunas de Navegação */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Aluno
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block"
                  >
                    Validar certificado
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block"
                  >
                    Remarcações
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block"
                  >
                    Portal do Aluno
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Sobre
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block"
                  >
                    Metodologia
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block"
                  >
                    Carreiras
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block"
                  >
                    Termos de Uso
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Suporte
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block"
                  >
                    Fale Conosco
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors block"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div className="lg:col-span-2 space-y-4">
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
          <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-xs font-medium">
              © 2025 FluencyLab. Todos os direitos reservados.
            </p>

            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-primary transition-colors"
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

// Sub-componente para os botões sociais ficarem padronizados
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
        "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-all hover:scale-110 hover:shadow-md",
        color,
      )}
    >
      {children}
    </a>
  );
}
