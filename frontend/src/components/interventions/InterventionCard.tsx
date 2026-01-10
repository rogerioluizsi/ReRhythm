import { Card, CardContent } from "@/components/ui/card";
import { Clock, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Intervention } from "@/services/api";
import { getIconForIntervention } from "./utils.ts";

interface InterventionCardProps {
  intervention: Intervention;
  onClick: (intervention: Intervention) => void;
}

export function InterventionCard({ intervention, onClick }: InterventionCardProps) {
  const Icon = getIconForIntervention(intervention);
  const isCompleted = (intervention.times_completed || 0) > 0;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden hover:shadow-lg",
        isCompleted && "bg-primary/5 border-primary/20"
      )}
      onClick={() => onClick(intervention)}
    >
      {isCompleted && (
        <div className="absolute top-0 right-0 bg-green-500/10 text-green-600 px-3 py-1 rounded-bl-lg text-xs font-medium flex items-center gap-1">
          <Check className="w-3 h-3" /> {intervention.times_completed}
        </div>
      )}
      <CardContent className="p-6 flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            isCompleted ? "bg-green-500/10" : "bg-primary/10 group-hover:bg-primary/20"
          )}
        >
          <Icon className={cn("h-6 w-6", isCompleted ? "text-green-600" : "text-primary")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 pr-12">
            <h3 className="font-medium text-foreground truncate">{intervention.name}</h3>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {intervention.duration_min} min
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] uppercase">
              {intervention.context}
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
}
