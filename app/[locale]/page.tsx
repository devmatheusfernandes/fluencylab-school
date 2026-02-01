"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../public/brand/Group.png";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from "@/components/ui/avatar";
import { CalendarDaysIcon } from "@/public/animated/calendar";

export default function LandingPage() {
  const t = useTranslations("LandingPage");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estado para o item selecionado na Navbar
  const [activeTab, setActiveTab] = useState<string>("plans");

  // Estado para o menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados para horário e saudação
  const [currentTime, setCurrentTime] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();

      // Format time HH:MM
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")}`;
      setCurrentTime(formattedTime);

      // Determine greeting
      if (hours >= 5 && hours < 12) {
        setGreeting("morning");
      } else if (hours >= 12 && hours < 18) {
        setGreeting("afternoon");
      } else {
        setGreeting("night");
      }
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleLoginClick = () => {
    if (session) {
      router.push("/hub");
    } else {
      router.push("/signin");
    }
  };

  const navLinksLeft = [
    { id: "about", label: t("nav.about"), href: "#" },
    { id: "plans", label: t("nav.plans"), href: "#" },
  ];

  const navLinksRight = [
    { id: "team", label: t("nav.team"), href: "#" },
    { id: "faq", label: t("nav.faq"), href: "#" },
  ];

  const NavItem = ({
    id,
    label,
    href,
  }: {
    id: string;
    label: string;
    href: string;
  }) => (
    <Link
      href={href}
      onClick={(e) => {
        e.preventDefault();
        setActiveTab(id);
      }}
      className="relative px-6 py-3 rounded-full text-sm font-medium outline-none focus-visible:ring-2"
    >
      {activeTab === id && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-gray-900 dark:bg-stone-950"
          style={{ borderRadius: 9999 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">
        <motion.span
          animate={{
            color:
              activeTab === id
                ? typeof window !== "undefined" &&
                  window.matchMedia("(prefers-color-scheme: dark)").matches
                  ? "#ffffffff"
                  : "#ffffff"
                : "#dfdfdfff dark:#9ca3af",
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.span>
      </span>
    </Link>
  );

  return (
    // MUDANÇA: bg-accent -> bg-gray-50 dark:bg-gray-950 (Fundo global igual ao Login)
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-2 md:p-4 flex flex-col font-sans transition-colors duration-300">
      {/* MUDANÇA: bg-background -> bg-white dark:bg-gray-900 (Container principal igual ao Card de Login) */}
      <div className="relative max-h-[97vh] flex-1 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800">
        <header className="hidden md:flex absolute top-0 left-0 w-full p-4 px-4 flex-row justify-between items-center z-50 pointer-events-none">
          {/* CÁPSULA ESQUERDA */}
          {/* MUDANÇA: Cores ajustadas para contrastar com o fundo branco (agora cinza claro com borda) */}
          <div className="pointer-events-auto bg-white dark:bg-white/2 rounded-full p-2 shadow-xs flex items-center gap-2">
            <div className="flex items-center gap-3 pl-4 pr-2">
              <Image
                src={Logo}
                alt="Logo"
                width={140}
                height={140}
                className="object-contain"
              />
            </div>
            <nav className="flex items-center gap-1">
              {navLinksLeft.map((link) => (
                <NavItem key={link.id} {...link} />
              ))}
            </nav>
          </div>

          {/* CÁPSULA DIREITA */}
          <div className="pointer-events-auto bg-white dark:bg-white/2 rounded-full p-2 shadow-xs flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {navLinksRight.map((link) => (
                <NavItem key={link.id} {...link} />
              ))}
            </nav>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoginClick}
              className="bg-black/3 dark:bg-white/2 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 min-h-[44px]"
            >
              {status === "loading" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : session ? (
                <>
                  <span>{t("nav.continue")}</span>
                  <Avatar size="xs">
                    <AvatarImage src={session.user?.image || undefined} />
                    <AvatarFallback />
                  </Avatar>
                </>
              ) : (
                t("nav.login")
              )}
            </motion.button>
          </div>
        </header>

        <header className="md:hidden w-full p-4 flex justify-between items-center z-40 relative">
          <div className="w-36 relative">
            <Image
              src={Logo}
              alt="Logo"
              height={40}
              className="object-contain"
            />
          </div>

          <button
            onClick={handleLoginClick}
            className="bg-black/3 dark:bg-white/2 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white px-4 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
          >
            {session ? (
              <>
                <span>{t("nav.continue")}</span>
                <Avatar size="xs">
                  <AvatarImage src={session.user?.image || undefined} />
                  <AvatarFallback />
                </Avatar>
              </>
            ) : (
              t("nav.login")
            )}
          </button>
        </header>

        <main className="w-full h-full relative grid grid-cols-1 lg:grid-cols-2 flex-1">
          <div className="flex flex-col justify-center lg:justify-end px-6 md:px-12 lg:px-14 pb-12 lg:pb-20 z-20 order-1 pt-22 lg:pt-0">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col text-center sm:text-left">
              {/* MUDANÇA: Cores de texto ajustadas para text-gray-600 (igual ao login description) */}
              <p className="text-gray-600 dark:text-gray-300 font-medium text-sm md:text-sm max-w-md">
                <span
                  dangerouslySetInnerHTML={{
                    __html: t.raw("heroSubtitle"),
                  }}
                />
              </p>

              {/* MUDANÇA: Texto principal mais escuro/nítido */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-gray-900 dark:text-white leading-[0.95] mb-8 mt-2">
                {t("title")}
              </h1>

              <div className="flex flex-col sm:flex-row gap-3 ">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-row items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-full font-medium border border-gray-200 dark:border-gray-700"
                >
                  <CalendarDaysIcon size={24} />
                  {t("primaryCta")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-4 rounded-full font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("secondaryCta")}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="relative w-full min-h-[450px] lg:h-full order-2 lg:static pointer-events-none overflow-visible">
            <div
              className="
                relative w-full h-full flex items-end justify-center lg:block
                lg:absolute lg:top-32 lg:right-40 lg:w-auto lg:h-auto
              "
            >
              {/* --- COMPONENTE VISUAL ANIMADO --- */}
              <motion.div
                initial={{ opacity: 0, y: 100, rotate: 10 }}
                animate={{ opacity: 1, y: 0, rotate: -6 }}
                whileHover={{ rotate: 0, scale: 1.02 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  mass: 1,
                  delay: 0.2,
                }}
                className="relative z-10 w-[380px] md:w-[320px] lg:w-[500px] -translate-y-22 translate-x-5 lg:translate-y-0 lg:mt-0 cursor-pointer"
              >
                {/* MUDANÇA: Borda do telefone ajustada para combinar com o tema */}
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-[6px] border-gray-100 dark:border-gray-800 ring-1 ring-gray-900/5 flex flex-col overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="absolute top-0 w-full h-6 z-20 flex justify-between px-6 items-center mt-3">
                    <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">
                      {currentTime || "9:41"}
                    </div>
                    <div className="flex gap-1">
                      <div className="w-4 h-2.5 bg-gray-800 dark:bg-gray-200 rounded-[2px]" />
                    </div>
                  </div>

                  {/* Conteúdo da Tela com Scroll */}
                  {/* MUDANÇA: Fundo interno do telefone */}
                  <div className="flex-1 bg-gray-50 dark:bg-gray-950 pt-10 px-5 pb-6 flex flex-col gap-4 overflow-hidden">
                    {/* Header App */}
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          {greeting
                            ? t(`heroCard.greeting.${greeting}`)
                            : t("heroCard.greeting.morning")}
                        </p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white/90">
                          {session?.user?.name
                            ? session.user.name.split(" ")[0]
                            : t("heroCard.defaultName")}
                        </h3>
                      </div>
                      <Avatar size="sm">
                        <AvatarImage src={session?.user?.image || undefined} />
                        <AvatarFallback />
                      </Avatar>
                    </div>

                    {/* Card 1: Aula Atual */}
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                      <div className="absolute right-0 top-0 w-20 h-20 bg-orange-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                      <div className="relative z-10">
                        <span className="inline-block px-2 py-1 bg-amber-100 dark:bg-amber-500 text-orange-700 dark:text-white text-[10px] font-bold rounded-md mb-2">
                          {t("heroCard.lessonLabel")}
                        </span>
                        <h4 className="font-bold text-gray-800 dark:text-white text-lg leading-tight mb-1">
                          {t("heroCard.lessonTitle")}
                        </h4>
                        <p className="text-xs text-gray-500 mb-3">
                          {t("heroCard.lessonSubtitle")}
                        </p>
                        <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg
                            width="12"
                            height="12"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Lista de Revisão */}
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                          {t("heroCard.reviewTitle")}
                        </h4>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {t("heroCard.reviewCount")}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            W
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                              {t("heroCard.words.water")}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {t("heroCard.words.waterTrans")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                            B
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                              {t("heroCard.words.bread")}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-400">
                              {t("heroCard.words.breadTrans")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                            B
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                              {t("heroCard.words.bread")}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-400">
                              {t("heroCard.words.breadTrans")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Progresso */}
                    <div className="mt-auto bg-gray-900 rounded-3xl p-5 text-white relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                      <div className="relative z-10 flex justify-between items-end">
                        <div>
                          <p className="text-gray-400 text-xs font-medium mb-1">
                            {t("heroCard.progressTitle")}
                          </p>
                          <div className="text-3xl font-bold tracking-tight">
                            42%
                          </div>
                          <div className="text-[10px] text-green-400 font-medium mt-1 flex items-center gap-1">
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path d="M18 15l-6-6-6 6" />
                            </svg>
                            {t("heroCard.progressGrowth")}
                          </div>
                        </div>
                        <div className="h-10 w-16">
                          <svg
                            viewBox="0 0 64 32"
                            className="w-full h-full text-green-500 overflow-visible"
                          >
                            <path
                              d="M0 32 L10 25 L20 28 L30 15 L40 20 L50 10 L64 5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx="64" cy="5" r="3" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              {/* --- FIM DO COMPONENTE VISUAL --- */}
            </div>
          </div>
        </main>

        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Bottom Sheet */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Overlay Escuro */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-[4px] md:hidden"
              />

              {/* Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                // MUDANÇA: Fundo do menu mobile para combinar
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-[2rem] p-8 pb-10 z-[70] md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
              >
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Menu
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
                  >
                    <X className="w-6 h-6 text-red-500" />
                  </button>
                </div>

                <nav className="flex flex-col gap-4">
                  {[...navLinksLeft, ...navLinksRight].map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className="text-lg font-medium text-gray-700 dark:text-gray-200 py-3 border-b border-gray-100 dark:border-gray-800"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLoginClick}
                    className="mt-4 w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    {session ? (
                      <>
                        <span>{t("nav.continue")}</span>
                        <Avatar size="sm">
                          <AvatarImage src={session.user?.image || undefined} />
                          <AvatarFallback />
                        </Avatar>
                      </>
                    ) : (
                      t("nav.login")
                    )}
                  </button>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
