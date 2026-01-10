import { 
  Wind, 
  Brain, 
  Heart, 
  Zap, 
  Clock, 
  Activity
} from "lucide-react";
import { type Intervention } from "@/services/api";

// Map intervention properties to icons
export const getIconForIntervention = (intervention: Intervention) => {
  const name = intervention.name.toLowerCase();
  // Safe check for goal_tags as array
  const tags = Array.isArray(intervention.goal_tags) 
    ? intervention.goal_tags.join(" ").toLowerCase() 
    : "";
  const context = intervention.context ? intervention.context.toLowerCase() : "";

  if (name.includes("breath")) return Wind;
  if (tags.includes("ground") || context.includes("panic")) return Zap;
  if (tags.includes("cognit") || tags.includes("mind") || tags.includes("focus")) return Brain;
  if (tags.includes("emotion") || tags.includes("heart") || context.includes("conflict")) return Heart;
  if (tags.includes("somatic") || tags.includes("body") || intervention.modality === "physical") return Activity;
  
  return Clock; // Default
};
