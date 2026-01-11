import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { wearableCheck, wearableView, libraryGetInterventions, Intervention } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Activity, Moon, Heart, Brain, Zap, TrendingUp, RefreshCw } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Label } from "recharts";

// Types from JSON structure (user provided)
interface HealthData {
  sync_timestamp: string;
  date: string;
  device_type: string;
  summary: {
    readiness_score: number;
    sleep_score: number;
    activity_score: number;
    stress_resilience: string;
  };
  biometrics: {
    resting_heart_rate: number;
    hrv_avg_ms: number;
    hrv_max_ms: number;
    skin_temp_deviation: number;
    spo2_avg: number;
    respiratory_rate: number;
  };
  sleep: {
    total_sleep_duration_min: number;
    time_in_bed_min: number;
    efficiency_percent: number;
    latency_min: number;
    phases: {
      deep_sleep_min: number;
      rem_sleep_min: number;
      light_sleep_min: number;
      awake_min: number;
    };
    hypnogram_5min: number[];
    lowest_heart_rate_timestamp: string;
  };
  activity: {
    steps: number;
    cal_total: number;
    cal_active: number;
    movement_intensity_avg: string;
    inactivity_alerts: number;
    workouts: Array<{
      type: string;
      start_time: string;
      duration_min: number;
      cal_burn: number;
      avg_hr: number;
      max_hr: number;
    }>;
  };
  trends: {
    hr_5min_samples: number[];
    hrv_5min_samples: number[];
  };
}

export function useAuthContext() {
    const context = useAuth();
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default function Dashboard() {
  const { user } = useAuthContext();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [recentInterventions, setRecentInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      loadData(user.user_id);
    }
  }, [user]);

  const loadData = async (userId: number) => {
    setLoading(true);
    try {
      const checkRes = await wearableCheck(userId);
      if (checkRes.success && checkRes.data) {
        setHealthData(checkRes.data as HealthData);
        setLoading(false); // Allow dashboard to render immediately
        
        // Fetch AI analysis separately
        setAiLoading(true);
        try {
            const viewRes = await wearableView(userId, 1);
            if (viewRes && viewRes.length > 0) {
                setAiAnalysis(viewRes[0].wearable_data_summary);
            }
        } catch (e) {
            console.error("Failed to load AI analysis", e);
        } finally {
            setAiLoading(false);
        }

        // Fetch recent interventions
        try {
          const interventionsRes = await libraryGetInterventions({ user_id: userId });
          if (interventionsRes && interventionsRes.interventions) {
              const completed = interventionsRes.interventions
                  .filter(i => i.last_completed)
                  .sort((a, b) => new Date(b.last_completed!).getTime() - new Date(a.last_completed!).getTime())
                  .slice(0, 2);
              setRecentInterventions(completed);
          }
        } catch (e) {
          console.error("Failed to load interventions", e);
        }

      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to load wearable data", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="bg-muted p-6 rounded-full">
            <Activity className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">No Health Data Found</h2>
        <p className="text-muted-foreground max-w-md">
          Sync your wearable in Config to see your health status and receive support.
        </p>
        <Button asChild>
          <Link to="/settings">Go to Config</Link>
        </Button>
      </div>
    );
  }

  // Prepare chart data
    const hrData = healthData.trends.hr_5min_samples.map((val, idx) => ({ time: idx, value: val }));

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Health Dashboard</h1>
            <p className="text-muted-foreground">
                Last synced: {new Date(healthData.sync_timestamp).toLocaleString()}
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => user?.user_id && loadData(user.user_id)}>
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* AI Analysis Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Brain className="h-8 w-8 text-primary" />
            <div className="flex-1">
                <CardTitle className="text-xl text-primary">AI Health Analysis</CardTitle>
                <CardDescription> personalized insights based on your latest metrics</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            {aiLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground h-12">
                    <span className="animate-pulse">Analyzing your biometrics...</span>
                </div>
            ) : aiAnalysis ? (
                <p className="leading-relaxed text-foreground/90 font-medium">
                    {aiAnalysis}
                </p>
            ) : (
                <p className="text-muted-foreground italic">No analysis available.</p>
            )}
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
            title="Readiness" 
            value={healthData.summary.readiness_score} 
            max={100} 
            icon={<Zap className="h-4 w-4 text-yellow-500" />}
            color="text-yellow-600"
        />
        <MetricCard 
            title="Sleep Score" 
            value={healthData.summary.sleep_score} 
            max={100} 
            icon={<Moon className="h-4 w-4 text-indigo-500" />}
            color="text-indigo-600"
        />
        <MetricCard 
            title="Activity" 
            value={healthData.summary.activity_score} 
            max={100} 
            icon={<Activity className="h-4 w-4 text-emerald-500" />}
            color="text-emerald-600"
        />
        <MetricCard 
            title="Resilience" 
            value={healthData.summary.stress_resilience} 
            isText 
            icon={<Heart className="h-4 w-4 text-rose-500" />}
            color="text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biometrics */}
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" /> Biometrics
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <BiometricRow label="Resting HR" value={`${healthData.biometrics.resting_heart_rate} bpm`} />
                <BiometricRow label="HRV (Avg)" value={`${healthData.biometrics.hrv_avg_ms} ms`} />
                <BiometricRow label="SpO2" value={`${healthData.biometrics.spo2_avg}%`} />
                <BiometricRow label="Resp. Rate" value={`${healthData.biometrics.respiratory_rate} rpm`} />
                <BiometricRow label="Skin Temp" value={`${healthData.biometrics.skin_temp_deviation > 0 ? '+' : ''}${healthData.biometrics.skin_temp_deviation}°C`} />
            </CardContent>
        </Card>

        {/* Charts */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Heart Rate Variability (Last few hours)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hrData}>
                        <defs>
                            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} />
                        <RechartsTooltip />
                        <Area type="monotone" dataKey="value" stroke="#ef4444" fillOpacity={1} fill="url(#colorHr)" strokeWidth={2} />
                        {recentInterventions.map((intervention, idx) => {
                             const xPos = Math.floor(hrData.length * ((idx + 1) / (recentInterventions.length + 1)));
                             return (
                                <ReferenceLine key={intervention.id} x={xPos} stroke="#3b82f6" strokeDasharray="3 3">
                                    <Label value={intervention.name} position="insideTop" fill="#3b82f6" fontSize={12} />
                                </ReferenceLine>
                             )
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      {/* Sleep & Activity Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5" /> Sleep Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/40 p-3 rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Duration</div>
                        <div className="text-2xl font-bold">
                            {Math.floor(healthData.sleep.total_sleep_duration_min / 60)}h {healthData.sleep.total_sleep_duration_min % 60}m
                        </div>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Efficiency</div>
                        <div className="text-2xl font-bold">{healthData.sleep.efficiency_percent}%</div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Deep Sleep</span> <span>{healthData.sleep.phases.deep_sleep_min}m</span></div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${(healthData.sleep.phases.deep_sleep_min / healthData.sleep.total_sleep_duration_min) * 100}%` }} />
                    </div>
                    
                    <div className="flex justify-between text-sm mt-2"><span>REM Sleep</span> <span>{healthData.sleep.phases.rem_sleep_min}m</span></div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${(healthData.sleep.phases.rem_sleep_min / healthData.sleep.total_sleep_duration_min) * 100}%` }} />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" /> Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/40 p-3 rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Steps</div>
                        <div className="text-2xl font-bold">{healthData.activity.steps.toLocaleString()}</div>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground">Calories</div>
                        <div className="text-2xl font-bold">{healthData.activity.cal_total}</div>
                    </div>
                </div>
                {healthData.activity.workouts.length > 0 && (
                     <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Recent Workouts</h4>
                        {healthData.activity.workouts.map((workout, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded border">
                                <div>
                                    <div className="font-medium capitalize">{workout.type}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(workout.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {workout.duration_min} min</div>
                                </div>
                                <div className="text-sm font-bold text-orange-500">
                                    {workout.cal_burn} cal
                                </div>
                            </div>
                        ))}
                     </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, max, icon, color, isText = false }: { title: string, value: string | number, max?: number, icon: any, color?: string, isText?: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color || ''}`}>
                    {typeof value === 'string' ? value.toUpperCase() : value}
                    {!isText && max && <span className="text-sm text-muted-foreground font-normal">/{max}</span>}
                </div>
            </CardContent>
        </Card>
    )
}

function BiometricRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-0 border-border/50">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    )
}
