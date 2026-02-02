"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-2 md:p-4 flex flex-col font-sans transition-colors duration-300">
      <div className="relative max-h-[97vh] flex-1 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800">
        <LandingNavbar />
        <LandingHero />
      </div>
    </div>
  );
}
