"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../public/brand/Group.png";
import { motion, AnimatePresence } from "framer-motion";
import { DoorOpenIcon, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function LandingNavbar() {
  const t = useTranslations("LandingPage");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estado para o item selecionado na Navbar
  const [activeTab, setActiveTab] = useState<string>("plans");

  // Estado para o menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginClick = () => {
    if (session) {
      router.push("/hub");
    } else {
      router.push("/signin");
    }
  };

  const handleSwitchAccount = async () => {
    await signOut({ callbackUrl: "/signin" });
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
    <>
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
              <>
                <span>{t("nav.login")}</span>
                <DoorOpenIcon className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </header>

      <header className="md:hidden w-full p-4 flex justify-between items-center z-40 relative">
        <div className="w-36 relative">
          <Image src={Logo} alt="Logo" height={40} className="object-contain" />
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
                {session && (
                  <button
                    onClick={handleSwitchAccount}
                    className="mt-1 w-full text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors py-2"
                  >
                    {t("nav.switchAccount")}
                  </button>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
