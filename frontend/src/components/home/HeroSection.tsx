import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Heart, Clock, Eye } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 gradient-calm" />
      <div className="absolute inset-0 gradient-glow" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
      
      {/* Content */}
      <div className="relative container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Privacy Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-primary/20 animate-fade-in">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">No identity required. No trail. Your data, your control.</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-tight animate-slide-up">
            Support for the moments{" "}
            <span className="text-primary">you can't share</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            A private wellness companion designed for healthcare clinicians. 
            Process difficult experiences, manage stress, and recover without 
            creating a professional liability trail.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/check-in">
              <Button variant="glow" size="xl" className="gap-2">
                <Heart className="h-5 w-5" />
                Start Anonymous Check-in
              </Button>
            </Link>
            <Link to="/interventions">
              <Button variant="calm" size="xl" className="gap-2">
                <Clock className="h-5 w-5" />
                Quick Intervention
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
              <Eye className="h-5 w-5 text-primary opacity-70" />
              <span className="text-sm text-muted-foreground">No employer access</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
              <Shield className="h-5 w-5 text-primary opacity-70" />
              <span className="text-sm text-muted-foreground">PHI auto-redaction</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
              <Clock className="h-5 w-5 text-primary opacity-70" />
              <span className="text-sm text-muted-foreground">Ephemeral journaling</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
