"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Blog } from "@/types/learning/immersion";

export function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Skeleton da Lista Principal */}
      <div className="lg:col-span-8 space-y-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-[320px] aspect-[16/10] rounded-xl" />
            <div className="flex-1 space-y-4 pt-2">
              <Skeleton className="h-8 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-5 w-24 mt-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton da Sidebar */}
      <div className="lg:col-span-4 space-y-10 pl-0 lg:pl-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Interfaces (ajuste conforme seu banco de dados)
interface BlogPageContentProps {
  blogs: Blog[];
  popularBlogs?: Blog[];
}

// Animações
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 50 },
  },
};

export function BlogPageContent({
  blogs,
  popularBlogs = [],
}: BlogPageContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* --- COLUNA ESQUERDA: LISTA DE BLOGS (Ocupa 8 colunas) --- */}
      <div className="lg:col-span-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-12"
        >
          {blogs.map((blog) => (
            <motion.div key={blog.id} variants={itemVariants}>
              <Link
                href={`/hub/student/my-immersion/blogs/${blog.id}`}
                className="group block"
              >
                <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
                  {/* Imagem do Post */}
                  <div className="w-full md:w-[320px] shrink-0 overflow-hidden rounded-xl aspect-[16/10] bg-muted relative">
                    <Image
                      src={blog.coverImageUrl}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Conteúdo de Texto */}
                  <div className="flex-1 space-y-3 pt-1">
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {
                        "Dive into the world of immersion with this article. Learn how to expand your vocabulary and understand the nuances of the language..."
                      }
                    </p>

                    <div className="pt-2 flex items-center text-rose-600 font-medium group-hover:text-rose-700 transition-colors">
                      Read More{" "}
                      <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* --- COLUNA DIREITA: SIDEBAR (Ocupa 4 colunas) --- */}
      <aside className="lg:col-span-4 space-y-10 pl-0 lg:pl-8 border-t lg:border-t-0 lg:border-l border-border pt-10 lg:pt-0">
        {/* Widget: Posts Populares */}
        <div className="space-y-6">
          <h4 className="text-lg font-bold">Popular Posts</h4>
          {popularBlogs.length > 0 ? (
            <div className="space-y-6">
              {popularBlogs.map((post) => (
                <Link
                  key={post.id}
                  href={`/hub/student/my-immersion/blogs/${post.id}`}
                  className="flex gap-4 group items-center"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No popular posts found.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
