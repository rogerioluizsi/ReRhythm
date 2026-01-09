import { useState, useEffect } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wind, 
  Brain, 
  Heart, 
  Zap, 
  Clock, 
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronRight,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { libraryGetInterventions, libraryCompleteIntervention, type Intervention as ApiIntervention } from "@/services/api";

type InterventionState = "selection" | "active" | "complete";

// Map categories to icons
const getIconForCategory = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes("breath")) return Wind;
  if (lower.includes("ground")) return Zap;
  if (lower.includes("cognit") || lower.includes("mind")) return Brain;
  if (lower.includes("emotion") || lower.includes("heart")) return Heart;
  if (lower.includes("somatic") || lower.includes("body")) return Activity;
  return Clock; // Default
};

function BreathingExercise({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale");
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(1);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;
    
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          setPhase((currentPhase) => {
            if (currentPhase === "inhale") return "hold1";
            if (currentPhase === "hold1") return "exhale";
            if (currentPhase === "exhale") return "hold2";
            setCycle((c) => {
              if (c >= 4) {
                clearInterval(timer);
                setTimeout(onComplete, 500);
                return c;
              }
              return c + 1;
            });
            return "inhale";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, onComplete]); // Added dependencies

  const phaseLabels = {
    inhale: "Breathe In",
    hold1: "Hold",
    exhale: "Breathe Out",
    hold2: "Hold",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Breathing Circle */}
      <div className="relative">
        <div
          className={cn(
            "w-48 h-48 rounded-full border-4 border-primary/30 flex items-center justify-center transition-all duration-1000",
            phase === "inhale" && "scale-110 border-primary bg-primary/10",
            phase === "hold1" && "scale-110 border-primary bg-primary/10",
            phase === "exhale" && "scale-100 border-primary/50 bg-primary/5",
            phase === "hold2" && "scale-100 border-primary/50 bg-primary/5"
          )}
        >
          <div className="text-center">
            <p className="text-4xl font-serif font-semibold text-primary">{count}</p>
            <p className="text-sm text-muted-foreground mt-1">{phaseLabels[phase]}</p>
          </div>
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <span className="text-xs text-muted-foreground">Cycle {cycle}/4</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setPhase("inhale");
            setCount(4);
            setCycle(1);
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Interventions() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<ApiIntervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<ApiIntervention | null>(null);
  const [state, setState] = useState<InterventionState>("selection");
  const [loading, setLoading] = useState(true);

  const fetchInterventions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await libraryGetInterventions({ user_id: user.user_id });
      setInterventions(data.interventions);
    } catch (error) {
      console.error("Failed to fetch interventions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, [user]);

  const handleStartIntervention = (intervention: ApiIntervention) => {
    setSelectedIntervention(intervention);
    setState("active");
  };

  const handleComplete = async () => {
    if (!selectedIntervention || !user) return;
    try {
      await libraryCompleteIntervention({
        user_id: user.user_id,
        intervention_id: String(selectedIntervention.id),
      });
      // Refresh to update "completed" status
      await fetchInterventions();
      setState("complete");
    } catch (error) {
      console.error("Failed to complete intervention:", error);
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="pt-24 pb-12 flex justify-center">
             <p>Loading interventions...</p>
          </main>
        </div>
     );
  }

  if (state === "complete") {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto">
              <Card className="text-center p-8 border-primary/20 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl mb-4">Nice work</CardTitle>
                <CardDescription className="mb-8">
                  You took a moment to care for yourself. That matters.
                </CardDescription>
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setState("selection");
                      setSelectedIntervention(null);
                    }}
                  >
                    Return to Library
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (state === "active" && selectedIntervention) {
    const Icon = getIconForCategory(selectedIntervention.category);
    // Be generous with matching "Box Breathing"
    const isBoxBreathing = selectedIntervention.name.toLowerCase().includes("box breath");

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{selectedIntervention.name}</CardTitle>
                  <CardDescription>
                    {selectedIntervention.trigger_case || selectedIntervention.category}
                    <br/>
                    <span className="text-xs text-muted-foreground mt-1 inline-block">
                        Target: {selectedIntervention.target_outcome}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isBoxBreathing ? (
                    <BreathingExercise onComplete={handleComplete} />
                  ) : (
                    <div className="py-6 space-y-6">
                      <div className="text-left bg-muted/30 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Steps to follow:</h4>
                            <ul className="list-disc pl-5 space-y-2">
                                {selectedIntervention.steps.map((step, idx) => (
                                    <li key={idx} className="text-foreground">{step}</li>
                                ))}
                            </ul>
                      </div>
                      
                      <div className="text-center pt-4">
                        <Button size="lg" onClick={handleComplete} className="w-full sm:w-auto">
                           Mark Complete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                <div className="p-4 pt-0 text-center">
                     <Button variant="ghost" size="sm" onClick={() => setState("selection")}>Cancel</Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
                Interventions Library
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Browse coping exercises and tools to help you reset.
              </p>
            </div>

            {/* Interventions List */}
            <div className="grid md:grid-cols-2 gap-4">
              {interventions.map((intervention) => {
                const Icon = getIconForCategory(intervention.category);
                const isCompleted = (intervention.times_completed || 0) > 0;
                
                return (
                  <Card
                    key={intervention.id}
                    className={cn(
                      "group cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden",
                      isCompleted && "bg-primary/5 border-primary/20"
                    )}
                    onClick={() => handleStartIntervention(intervention)}
                  >
                     {isCompleted && (
                        <div className="absolute top-0 right-0 bg-green-500/10 text-green-600 px-3 py-1 rounded-bl-lg text-xs font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> {intervention.times_completed}
                        </div>
                     )}
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          isCompleted ? "bg-green-500/10" : "bg-primary/10 group-hover:bg-primary/20"
                      )}>
                        <Icon className={cn("h-6 w-6", isCompleted ? "text-green-600" : "text-primary")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 pr-12">
                          <h3 className="font-medium text-foreground truncate">{intervention.name}</h3>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {intervention.estimated_time}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] uppercase">
                                {intervention.category}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {intervention.trigger_case}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {interventions.length === 0 && (
                <div className="text-center p-12 text-muted-foreground">
                    No interventions found.
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
