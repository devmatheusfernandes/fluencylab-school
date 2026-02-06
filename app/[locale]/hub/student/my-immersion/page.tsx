"use client";
import { Header } from "@/components/ui/header";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Headphones, BookOpen, Construction, Gamepad2 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export default function MyImmersionPage() {
  const constructionItems = [
    { title: "Wordle", icon: Gamepad2, color: "bg-emerald-950" },
    { title: "Guessly", icon: Gamepad2, color: "bg-stone-900" },
  ];

  return (
    <div className="container-padding space-y-6">
      <Header
        heading="My Immersion"
        subheading="Practice your listening and reading skills."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
        <Link href="/hub/student/my-immersion/podcasts">
          <Card className="group relative h-[270px] overflow-hidden border-0">
            <Image
              src="/immersion/podcast.jpg"
              alt="Podcasts"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Headphones className="h-5 w-5" />
                <h3 className="text-2xl font-bold">Podcasts</h3>
              </div>
              <p className="text-gray-200 text-sm font-medium">
                Aprenda ouvindo
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/hub/student/my-immersion/blogs">
          <Card className="group relative h-[270px] overflow-hidden border-0">
            <Image
              src="/immersion/blog.jpg"
              alt="Blogs"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-2xl font-bold">Blog</h3>
              </div>
              <p className="text-gray-200 text-sm font-medium">
                Artigos diários
              </p>
            </div>
          </Card>
        </Link>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-muted-foreground">
          Em breve
        </h3>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {constructionItems.map((item, index) => (
              <CarouselItem
                key={index}
                className="basis-1/2 md:basis-1/4 lg:basis-1/5"
              >
                <Card
                  className={`relative aspect-square overflow-hidden border-0 ${item.color} text-white`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <item.icon className="h-10 w-10 mb-3 opacity-80" />
                    <span className="text-lg font-bold">{item.title}</span>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-xs font-medium text-white/80">
                      <Construction className="h-3 w-3" />
                      Em construção
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
