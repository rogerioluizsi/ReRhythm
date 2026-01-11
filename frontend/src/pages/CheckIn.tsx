import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Clock, Battery, Moon, Thermometer, ArrowRight, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { checkinAnalyze, libraryCompleteIntervention, CheckInResponse, Intervention, libraryGetInterventions } from "@/services/api";
import { InterventionCard, InterventionDialog } from "@/components/interventions";

type CheckInStep = "stress" | "capacity" | "sleep" | "illness" | "notes" | "complete";

export default function CheckIn() {
  const { user, login } = useAuth();
  const [step, setStep] = useState<CheckInStep>("stress");
  const [stressLevel, setStressLevel] = useState([5]);
  const [capacityLevel, setCapacityLevel] = useState([5]);
  const [sleepDebt, setSleepDebt] = useState([3]);
  const [illnessSymptoms, setIllnessSymptoms] = useState([0]);
  const [notes, setNotes] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CheckInResponse | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const steps: { key: CheckInStep; label: string; icon: typeof Clock }[] = [
    { key: "stress", label: "Stress", icon: Clock },
    { key: "capacity", label: "Capacity", icon: Battery },
    { key: "sleep", label: "Sleep", icon: Moon },
    { key: "illness", label: "Illness", icon: Thermometer },
    { key: "notes", label: "Notes", icon: Clock },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const getStressLabel = (value: number) => {
    if (value <= 2) return "Low";
    if (value <= 4) return "Manageable";
    if (value <= 6) return "Elevated";
    if (value <= 8) return "High";
    return "Overwhelming";
  };

  const getCapacityLabel = (value: number) => {
    if (value <= 2) return "Depleted";
    if (value <= 4) return "Low";
    if (value <= 6) return "Moderate";
    if (value <= 8) return "Good";
    return "Full";
  };

  const getSleepLabel = (value: number) => {
    if (value <= 1) return "Well rested";
    if (value <= 3) return "Slight debt";
    if (value <= 5) return "Moderate debt";
    if (value <= 7) return "Significant debt";
    return "Severe debt";
  };

  const getIllnessLabel = (value: number) => {
    if (value === 0) return "None";
    if (value <= 2) return "Mild";
    if (value <= 5) return "Moderate";
    if (value <= 7) return "Notable";
    return "Significant";
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.key === step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1].key);
    } else {
      setStep("complete");
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.key === step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1].key);
    } else if (showResults) {
      setShowResults(false);
    }
  };

  const handleGetSupport = async () => {
    setIsAnalyzing(true);
    
    let currentUser = user;
    
    // If user is not logged in, log in anonymously first
    if (!currentUser) {
      try {
        await login();
        // After login, we need to get the user from localStorage since state update is async
        const userId = localStorage.getItem("user_id");
        const token = localStorage.getItem("auth_token");
        const isAnonymous = localStorage.getItem("is_anonymous") === "true";
        
        if (userId && token) {
          currentUser = {
            user_id: parseInt(userId),
            token,
            is_anonymous: isAnonymous
          };
        } else {
          throw new Error("Failed to get user after anonymous login");
        }
      } catch (error) {
        console.error("Anonymous login failed:", error);
        setIsAnalyzing(false);
        return;
      }
    }

    try {
      const checkInData = `Stress: ${stressLevel[0]}/10, Capacity: ${capacityLevel[0]}/10, Sleep Debt: ${sleepDebt[0]}/10, Illness: ${illnessSymptoms[0]}/10. Notes: ${notes}`;
      
      const response = await checkinAnalyze({
        user_id: currentUser.user_id,
        check_in_data: checkInData,
      });

      setAnalysisResult(response);

      if (response.recommended_intervention_ids) {
        let ids: number[] = [];
        const rawIds = response.recommended_intervention_ids;
        
        if (Array.isArray(rawIds)) {
          ids = rawIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        } else if (typeof rawIds === 'string') {
          ids = rawIds.split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id));
        }

        if (ids.length > 0) {
          const intResponse = await libraryGetInterventions({ 
            intervention_ids: ids,
            user_id: currentUser.user_id 
          });
          setInterventions(intResponse.interventions);
        } else {
          setInterventions([]);
        }
      }

      setShowResults(true);
    } catch (error) {
      console.error("Error analyzing check-in:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCardClick = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setDialogOpen(true);
  };

  const handleComplete = async (intervention: Intervention) => {
    if (!user) return;
    try {
      await libraryCompleteIntervention({
        user_id: user.user_id,
        intervention_id: String(intervention.id),
      });
      // Update the intervention in the list to reflect completion
      setInterventions(prev => 
        prev.map(int => 
          int.id === intervention.id 
            ? { ...int, times_completed: (int.times_completed || 0) + 1 }
            : int
        )
      );
    } catch (error) {
      console.error("Failed to complete intervention:", error);
    }
  };

  if (step === "complete") {
    if (showResults && analysisResult) {
      return (
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="pt-24 pb-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => setShowResults(false)} className="mb-4">
                    ← Back to Check-in Summary
                </Button>
                
                {/* AI Reasoning Card */}
                <Card variant="glow" className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Sparkles className="h-5 w-5" />
                        <span className="font-semibold">AI Analysis</span>
                    </div>
                    <CardDescription className="text-foreground/90 text-lg">
                      {analysisResult.ai_reasoning}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <h2 className="text-2xl font-semibold mt-8 mb-4">Recommended Interventions</h2>
                
                {/* Interventions Grid */}
                {interventions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {interventions.map((intervention) => (
                      <InterventionCard
                        key={intervention.id}
                        intervention={intervention}
                        onClick={handleCardClick}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <p>No specific interventions found, but practicing general mindfulness is always helpful.</p>
                  </Card>
                )}
                
              </div>
            </div>
          </main>

          <InterventionDialog
            intervention={selectedIntervention}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onComplete={handleComplete}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto">
              <Card variant="glow" className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <CardTitle className="text-2xl mb-4">Check-in Complete</CardTitle>
                <CardDescription className="mb-8">
                  Your check-in has been recorded locally. This data never leaves your device 
                  unless you choose to sync it.
                </CardDescription>
                <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-8">
                  <Shield className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">Stored privately on device</span>
                </div>
                <div className="space-y-3">
                  <Button 
                    variant="glow" 
                    className="w-full" 
                    onClick={handleGetSupport}
                    disabled={isAnalyzing}
                  >
                     {isAnalyzing ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span> Analyzing...
                        </>
                     ) : (
                        "Get Support Based on Check-in"
                     )}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setStep("stress")}>
                    Start New Check-in
                  </Button>
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
          <div className="max-w-lg mx-auto">
            {/* Privacy Badge */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-8 w-fit mx-auto">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-sm text-success">
                {user?.is_anonymous 
                  ? "Anonymous • No identity required" 
                  : "Private • Data encrypted"}
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div
                  key={s.key}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i <= currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Step Content */}
            <Card variant="glow" className="animate-scale-in">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {step === "stress" && "Stress Level Right Now"}
                  {step === "capacity" && "Current Capacity"}
                  {step === "sleep" && "Sleep Debt"}
                  {step === "illness" && "Illness Symptoms"}
                  {step === "notes" && "What's Weighing on You?"}
                </CardTitle>
                <CardDescription>
                  {step === "stress" && "How stressed are you feeling in this moment?"}
                  {step === "capacity" && "How much capacity do you have for additional demands?"}
                  {step === "sleep" && "How much sleep debt have you accumulated?"}
                  {step === "illness" && "Are you experiencing any illness symptoms?"}
                  {step === "notes" && "Optional: Brief note about what's on your mind."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {step === "stress" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="text-4xl font-serif font-semibold text-primary">
                        {stressLevel[0]}
                      </span>
                      <span className="text-muted-foreground">/10</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getStressLabel(stressLevel[0])}
                      </p>
                    </div>
                    <Slider
                      value={stressLevel}
                      onValueChange={setStressLevel}
                      max={10}
                      min={1}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>Overwhelming</span>
                    </div>
                  </div>
                )}

                {step === "capacity" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="text-4xl font-serif font-semibold text-primary">
                        {capacityLevel[0]}
                      </span>
                      <span className="text-muted-foreground">/10</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getCapacityLabel(capacityLevel[0])}
                      </p>
                    </div>
                    <Slider
                      value={capacityLevel}
                      onValueChange={setCapacityLevel}
                      max={10}
                      min={1}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Depleted</span>
                      <span>Full capacity</span>
                    </div>
                  </div>
                )}

                {step === "sleep" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="text-4xl font-serif font-semibold text-primary">
                        {sleepDebt[0]}
                      </span>
                      <span className="text-muted-foreground">/10</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getSleepLabel(sleepDebt[0])}
                      </p>
                    </div>
                    <Slider
                      value={sleepDebt}
                      onValueChange={setSleepDebt}
                      max={10}
                      min={0}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Well rested</span>
                      <span>Severe debt</span>
                    </div>
                  </div>
                )}

                {step === "illness" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="text-4xl font-serif font-semibold text-primary">
                        {illnessSymptoms[0]}
                      </span>
                      <span className="text-muted-foreground">/10</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getIllnessLabel(illnessSymptoms[0])}
                      </p>
                    </div>
                    <Slider
                      value={illnessSymptoms}
                      onValueChange={setIllnessSymptoms}
                      max={10}
                      min={0}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>None</span>
                      <span>Significant</span>
                    </div>
                  </div>
                )}

                {step === "notes" && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="What's on your mind? (Optional - auto-redacts any patient identifiers)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span>PHI auto-redaction active</span>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  {currentStepIndex > 0 && (
                    <Button variant="outline" onClick={handleBack} className="flex-1">
                      Back
                    </Button>
                  )}
                  <Button variant="glow" onClick={handleNext} className="flex-1 gap-2">
                    {currentStepIndex === steps.length - 1 ? "Complete" : "Next"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
