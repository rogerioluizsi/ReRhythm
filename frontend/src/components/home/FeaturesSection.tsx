import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Shield,
  Brain,
  Wind,
  Clock,
  Heart,
  Activity,
  FileX,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "True Privacy",
    description: "Start using immediately without email or identity. Delete everything with one tap. Your data never goes to employers.",
  },
  {
    icon: FileX,
    title: "PHI-Safe Writing",
    description: "Built-in detection prevents accidental patient identifiers from being stored. Write freely, stay compliant.",
  },
  {
    icon: Brain,
    title: "Distress-Aware Support",
    description: "Different stressors need different help. We distinguish acute stress, second-victim distress, moral injury, and fatigue.",
  },
  {
    icon: Wind,
    title: "Micro-Interventions",
    description: "Evidence-based techniques in 60 seconds or less. Breathing, grounding, cognitive reframes designed for acute care realities.",
  },
  {
    icon: Clock,
    title: "Ephemeral Journaling",
    description: "Entries auto-delete after your chosen duration. Unload distress without creating permanent records.",
  },
  {
    icon: Heart,
    title: "Second-Victim Support",
    description: "Structured debriefs for difficult cases. Immediate containment plus scheduled processing at a safer time.",
  },
  {
    icon: Activity,
    title: "Wearable Integration",
    description: "Connect HRV data for personalized stress detection. Your baseline, your thresholds, your patterns.",
  },
  {
    icon: Lock,
    title: "Recovery Debt Tracking",
    description: "Private signals for sleep debt, illness, and sustained overload. Support for the 'can't call out' reality.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Designed for your reality
          </h2>
          <p className="text-muted-foreground text-lg">
            Features built by understanding what clinicians actually face, not what wellness programs assume.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                variant="interactive"
                className="group animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
