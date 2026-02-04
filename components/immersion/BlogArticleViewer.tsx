"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { SimpleEditor } from "@/components/immersion/SimpleEditor";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const calculateReadingTime = (text: string) => {
  const wordsPerMinute = 200;
  const words = text?.trim().split(/\s+/).length || 0;
  const time = Math.ceil(words / wordsPerMinute);
  return `${time} min read`;
};

export function BlogArticleViewer({ blog }: { blog: any }) {
  const ref = useRef(null);

  // Hooks do Scroll
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax: A imagem move mais devagar que o scroll (y aumenta menos)
  const backgroundY = useTransform(scrollY, [0, 500], [0, 250]);

  // Opacidade do texto do Header: desaparece ao descer
  const textOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const textY = useTransform(scrollY, [0, 300], [0, 50]);

  return (
    <div ref={ref} className="min-h-screen pb-20">
      {/* --- HERO SECTION (FULL WIDTH & PARALLAX) --- */}
      <div className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden flex items-end">
        {/* Imagem de Fundo com Parallax */}
        <motion.div style={{ y: backgroundY }} className="absolute inset-0 z-0">
          <img
            src={blog.coverImageUrl}
            alt={blog.title}
            className="w-full h-[120%] object-cover object-center"
            // h-[120%] garante que não falte imagem embaixo quando der o scroll parallax
          />
          {/* Overlay Escuro para Legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />
        </motion.div>

        {/* Botão de Voltar (Fixo ou Absoluto no topo) */}
        <div className="absolute top-6 left-6 z-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="bg-background/20 backdrop-blur-md border-white/10 text-white hover:bg-background/40 hover:text-white rounded-full"
          >
            <Link href="/hub/student/my-immersion/blogs" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        </div>

        {/* Título e Metadados (Sobre a imagem) */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="relative z-4 w-full max-w-4xl mx-auto px-6 pb-12 md:pb-20"
        >
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/80 mb-6">
            <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(blog.createdAt), "MMMM dd, yyyy")}
            </span>
            <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
              <Clock className="h-3.5 w-3.5" />
              {calculateReadingTime(blog.content)}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm mb-6">
            {blog.title}
          </h1>

          {/* Indicador sutil para rolar para baixo */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-4 left-6 text-white/50 hidden md:block"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="relative z-4 bg-background">
        <div className="max-w-3xl mx-auto px-6 -mt-10 md:-mt-20">
          {" "}
          {/* Sobe um pouco sobre o Hero */}
          {/* Conteúdo do Blog */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="pt-10" // Padding top para compensar a margem negativa
          >
            <SimpleEditor content={blog.content} editable={false} />
          </motion.div>
          <div className="border-t mt-12 pt-8 flex justify-between text-muted-foreground text-sm">
            <p>Written by Immersion Bot</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to Top
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
