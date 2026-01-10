import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { type Intervention } from "@/services/api";
import { getIconForIntervention } from "./utils.ts";
import { BreathingExercise } from "./BreathingExercise";

interface InterventionDialogProps {
  intervention: Intervention | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (intervention: Intervention) => Promise<void>;
}

type DialogState = "active" | "complete";

export function InterventionDialog({
  intervention,
  open,
  onOpenChange,
  onComplete,
}: InterventionDialogProps) {
  const [state, setState] = useState<DialogState>("active");

  if (!intervention) return null;

  const Icon = getIconForIntervention(intervention);
  const isBoxBreathing = intervention.name.toLowerCase().includes("box breath");

  const handleComplete = async () => {
    await onComplete(intervention);
    setState("complete");
  };

  const handleClose = () => {
    setState("active");
    onOpenChange(false);
  };

  if (state === "complete") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <Card className="text-center p-6 border-0 shadow-none">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl mb-4">Nice work</CardTitle>
            <CardDescription className="mb-8">
              You took a moment to care for yourself. That matters.
            </CardDescription>
            <Button className="w-full" onClick={handleClose}>
              Close
            </Button>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">{intervention.name}</DialogTitle>
          <DialogDescription>
            {intervention.trigger_case || intervention.context}
            <br />
            <span className="text-xs text-muted-foreground mt-1 inline-block">
              Target: {intervention.target_outcome}
            </span>
          </DialogDescription>
        </DialogHeader>

        {isBoxBreathing ? (
          <BreathingExercise onComplete={handleComplete} />
        ) : (
          <div className="py-6 space-y-6">
            <div className="text-left bg-muted/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
                Steps to follow:
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                {intervention.steps.map((step, idx) => (
                  <li key={idx} className="text-foreground">
                    {step}
                  </li>
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

        <div className="pt-0 text-center">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
