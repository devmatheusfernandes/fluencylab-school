"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CookieConsent() {
  const t = useTranslations("CookieConsent");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Small delay to not overwhelm the user immediately
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 container-padding"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-xl p-3 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                  {t("message")}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  className="flex-1 md:flex-none"
                >
                  {t("decline")}
                </Button>
                <Button
                  onClick={handleAccept}
                  className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t("accept")}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
