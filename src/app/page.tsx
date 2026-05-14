import { HeroSection } from "@/components/landing/hero-section";
import {
  HowItWorksSection,
  FeaturesSection,
  CtaSection,
} from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-dvh">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
