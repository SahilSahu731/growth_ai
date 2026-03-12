import { AdaptiveIntelligenceSection } from "@/components/landing/adaptive-intelligence-section"
import { CoreFeaturesSection } from "@/components/landing/core-features-section"
import { FinalCtaSection } from "@/components/landing/final-cta-section"
import { GrowthSystemSlider } from "@/components/landing/growth-system-slider"
import { HeroSection } from "@/components/landing/hero-section"
import { LandingNavbar } from "@/components/landing/landing-navbar"
import { MvpSection } from "@/components/landing/mvp-section"
import { ProductThesisSection } from "@/components/landing/product-thesis-section"

export default function Home() {
  return (
    <div className="landing-atmosphere relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-96 animate-fade bg-[radial-gradient(circle_at_78%_16%,rgba(168,90,45,0.14),transparent_62%)]" />
      <div className="pointer-events-none absolute -left-32 top-136 z-0 h-64 w-64 rounded-full bg-[rgba(168,90,45,0.09)] blur-3xl animate-drift" />
      <div className="pointer-events-none absolute -right-36 top-216 z-0 h-56 w-56 rounded-full bg-[rgba(244,209,177,0.2)] blur-3xl animate-drift [animation-delay:1.6s]" />

      <div className="relative z-10">
        <LandingNavbar />
        <main>
          <HeroSection />
          <GrowthSystemSlider />
          <ProductThesisSection />
          <CoreFeaturesSection />
          <MvpSection />
          <AdaptiveIntelligenceSection />
          <FinalCtaSection />
        </main>
      </div>
    </div>
  )
}