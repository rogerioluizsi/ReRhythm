import { Navigation } from "@/components/layout/Navigation";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { PrivacySection } from "@/components/home/PrivacySection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <PrivacySection />
        
        {/* Footer */}
        <footer className="border-t border-border/50 py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              ReRhythm - Private wellness support for healthcare clinicians.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Not a substitute for professional mental health care. If you're in crisis, please contact emergency services.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;