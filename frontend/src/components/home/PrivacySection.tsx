import { Card } from "@/components/ui/card";
import { Shield, Trash2, Eye, Lock } from "lucide-react";

export function PrivacySection() {
  return (
    <section className="py-24 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-6">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">Privacy as a Product Feature</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Built for career-risk awareness
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We understand that seeking support can feel professionally dangerous. 
              ReRhythm is engineered to make it credible that using it won't create a liability trail.
            </p>
          </div>

          {/* Privacy Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="glow" className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    Anonymous by Default
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Start using interventions, log stress, and complete debriefs without 
                    entering an email, name, employer, or license-linked identity. 
                    Optional accounts use pseudonymous naming.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="glow" className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Trash2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    Deletion as Primary Workflow
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Delete individual entries or wipe everything without friction. 
                    Ephemeral journaling auto-deletes after your chosen duration: 
                    24 hours, 7 days, or custom.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="glow" className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    Never Routed to Employers
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Research mode is truly opt-in, de-identified, and engineered 
                    to prevent punitive use. The default: your data stays yours, 
                    inaccessible to institutions.
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="glow" className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    PHI Auto-Redaction
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Text entries pass through a PHI/PII detector that flags and 
                    redacts likely identifiers before storage. Voice notes transcribe 
                    and sanitize automatically.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
