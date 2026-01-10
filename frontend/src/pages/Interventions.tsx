import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { libraryGetInterventions, libraryCompleteIntervention, type Intervention as ApiIntervention } from "@/services/api";
import { InterventionCard, InterventionDialog } from "@/components/interventions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const MODALITIES = [
  "group", "somatic", "cognitive", "visualization", "breathing",
  "CBT", "physical", "journaling", "sensory", "reflective",
  "reframing", "mindfulness", "ritual", "meditation", "social", "writing"
];

const CONTEXTS = [
  "conflict", "trauma", "fatigue", "anxiety", "grief"
];

const ITEMS_PER_PAGE = 6;

export default function Interventions() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<ApiIntervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<ApiIntervention | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [modality, setModality] = useState<string>("all");
  const [context, setContext] = useState<string>("all");
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 10]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [modality, context, durationRange]);

  const filteredInterventions = useMemo(() => {
    return interventions.filter((intervention) => {
      const matchModality = modality === "all" || intervention.modality === modality; // Assuming 'modality' is a field
      // Check if API intervention has 'context' field or similar. 
      // Based on InterventionCard: intervention.context
      const matchContext = context === "all" || intervention.context === context;
      
      const duration = intervention.duration_min || 0;
      const matchDuration = duration >= durationRange[0] && duration <= durationRange[1];

      return matchModality && matchContext && matchDuration;
    });
  }, [interventions, modality, context, durationRange]);

  const totalPages = Math.ceil(filteredInterventions.length / ITEMS_PER_PAGE);
  const paginatedInterventions = filteredInterventions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCardClick = (intervention: ApiIntervention) => {
    setSelectedIntervention(intervention);
    setDialogOpen(true);
  };

  const handleComplete = async (intervention: ApiIntervention) => {
    if (!user) return;
    try {
      await libraryCompleteIntervention({
        user_id: user.user_id,
        intervention_id: String(intervention.id),
      });
      // specific optimistic update to avoid page reload flash (which resets dialog state)
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

            {/* Filters */}
            <div className="bg-card border rounded-lg p-6 mb-8 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Filters</h3>
                {(modality !== "all" || context !== "all" || durationRange[0] !== 0 || durationRange[1] !== 10) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setModality("all");
                      setContext("all");
                      setDurationRange([0, 10]);
                    }}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  >
                    Reset <X className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Modality
                  </label>
                  <Select value={modality} onValueChange={setModality}>
                    <SelectTrigger>
                      <SelectValue placeholder="All modalities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All modalities</SelectItem>
                      {MODALITIES.map(m => (
                        <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Context
                  </label>
                  <Select value={context} onValueChange={setContext}>
                    <SelectTrigger>
                      <SelectValue placeholder="All contexts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All contexts</SelectItem>
                      {CONTEXTS.map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Duration
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {durationRange[0]} - {durationRange[1]} mins
                    </span>
                  </div>
                  <Slider 
                    value={durationRange} 
                    min={0} 
                    max={10} 
                    step={1} 
                    onValueChange={(val) => setDurationRange(val as [number, number])} 
                    className="py-4"
                  />
                </div>
              </div>
            </div>

            {/* Interventions List */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {paginatedInterventions.map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  onClick={handleCardClick}
                />
              ))}
            </div>
            
            {paginatedInterventions.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                    No interventions found matching your criteria.
                </div>
            ) : (
              /* Pagination */
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
