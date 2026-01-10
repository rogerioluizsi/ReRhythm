import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BreathingExerciseProps {
  onComplete: () => void;
}

export function BreathingExercise({ onComplete }: BreathingExerciseProps) {
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
  }, [isRunning, onComplete]);

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
