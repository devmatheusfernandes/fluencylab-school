"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import ComparisonSection from "@/components/landing/ComparisonSection";
import HowItWorks from "@/components/landing/HowItWorks";
import TeamSection from "@/components/landing/TeamSection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-2 md:p-4 flex flex-col font-sans transition-colors duration-300 relative">
      {/* TEXTURE BACKGROUND */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.08] pointer-events-none" />

      <div className="relative max-h-[97vh] lg:min-h-[96vh] flex-1 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden flex flex-col">
        <LandingNavbar />
        <div id="hero" />
        <LandingHero />

        <video
          src="/videos/landing.mp4"
          autoPlay
          loop
          muted
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      <div id="plans" className="relative">
        <ComparisonSection />
      </div>

      <div id="team" className="relative">
        <TeamSection />
      </div>

      <div id="faq" className="relative">
        <HowItWorks />
      </div>

      <Footer />
    </div>
  );
}
