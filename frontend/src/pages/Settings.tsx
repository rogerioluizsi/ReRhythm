import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Shield, 
  Trash2, 
  Bell, 
  Moon,
  Watch,
  Download,
  AlertTriangle,
  Check,
  Clock,
  Volume2,
  VolumeX,
  Languages,
  Timer
} from "lucide-react";

type LanguageStyle = "performance" | "neutral" | "emotional";

interface UserPreferences {
  languageStyle: LanguageStyle;
  cooldownMinutes: number;
  typicalShiftDuration: number;
  autoDeleteJournalAfter: "24h" | "7d" | "30d" | "never";
  storeTranscripts: boolean;
}

const defaultPreferences: UserPreferences = {
  languageStyle: "neutral",
  cooldownMinutes: 30,
  typicalShiftDuration: 12,
  autoDeleteJournalAfter: "30d",
  storeTranscripts: false,
};

function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const setLanguageStyle = (style: LanguageStyle) => {
    setPreferences(prev => ({ ...prev, languageStyle: style }));
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
  };

  return { preferences, updatePreference, setLanguageStyle, resetToDefaults };
}

export default function Settings() {
  const { 
    preferences, 
    updatePreference, 
    setLanguageStyle,
    resetToDefaults 
  } = useUserPreferences();
  
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [wearableConnected, setWearableConnected] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDeleteAll = () => {
    localStorage.clear();
    setDeleted(true);
    setShowDeleteConfirm(false);
    setTimeout(() => setDeleted(false), 3000);
  };

  const languageOptions: { style: LanguageStyle; label: string; description: string }[] = [
    { style: "performance", label: "Performance", description: "Focus on recovery and function" },
    { style: "neutral", label: "Neutral", description: "Balanced, professional tone" },
    { style: "emotional", label: "Supportive", description: "Warmer, emotionally aware" },
  ];

  const autoDeleteOptions: { value: typeof preferences.autoDeleteJournalAfter; label: string }[] = [
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "never", label: "Never" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
                Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your privacy, preferences, and data.
              </p>
            </div>

            {/* Privacy Status */}
            <Card variant="glow" className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Privacy Status</CardTitle>
                    <CardDescription>Your data is private and secure</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">Anonymous mode active</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">In anonymous mode, data is session-only</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">PHI auto-redaction enabled</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">No employer access possible</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Intervention Preferences */}
            <div className="mb-8">
              <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                Intervention Preferences
              </h2>
              <div className="space-y-4">
                {/* Language Style */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Languages className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Language Style</CardTitle>
                        <CardDescription className="text-sm">
                          How ReRhythm communicates with you
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {languageOptions.map((option) => (
                        <Button
                          key={option.style}
                          variant={preferences.languageStyle === option.style ? "calm" : "outline"}
                          size="sm"
                          onClick={() => setLanguageStyle(option.style)}
                          className="flex-1"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      {languageOptions.find(o => o.style === preferences.languageStyle)?.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Cooldown */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Timer className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Intervention Cooldown</CardTitle>
                        <CardDescription className="text-sm">
                          Minimum time between prompts
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {preferences.cooldownMinutes} minutes
                      </span>
                    </div>
                    <Slider
                      value={[preferences.cooldownMinutes]}
                      onValueChange={([value]) => updatePreference("cooldownMinutes", value)}
                      min={10}
                      max={120}
                      step={10}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10 min</span>
                      <span>2 hours</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Shift Duration */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Typical Shift Duration</CardTitle>
                        <CardDescription className="text-sm">
                          Used for shift timing predictions
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {preferences.typicalShiftDuration} hours
                      </span>
                    </div>
                    <Slider
                      value={[preferences.typicalShiftDuration]}
                      onValueChange={([value]) => updatePreference("typicalShiftDuration", value)}
                      min={4}
                      max={24}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>4 hours</span>
                      <span>24 hours</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="mb-8">
              <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                Data & Privacy
              </h2>
              <div className="space-y-4">
                {/* Auto-delete journal */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Auto-Delete Journal Entries</CardTitle>
                        <CardDescription className="text-sm">
                          Ephemeral journaling for safety
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {autoDeleteOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={preferences.autoDeleteJournalAfter === option.value ? "calm" : "outline"}
                          size="sm"
                          onClick={() => updatePreference("autoDeleteJournalAfter", option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Store Transcripts */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {preferences.storeTranscripts ? (
                            <Volume2 className="h-5 w-5 text-primary" />
                          ) : (
                            <VolumeX className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Store Voice Transcripts</p>
                          <p className="text-sm text-muted-foreground">
                            {preferences.storeTranscripts 
                              ? "Sanitized transcripts are saved" 
                              : "Voice input is not stored"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.storeTranscripts}
                        onCheckedChange={(checked) => updatePreference("storeTranscripts", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* General Settings */}
            <div className="mb-8">
              <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                General
              </h2>
              <div className="space-y-4">
                {/* Notifications */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Check-in Reminders</p>
                          <p className="text-sm text-muted-foreground">Gentle, non-intrusive prompts</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications}
                        onCheckedChange={setNotifications}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Dark Mode */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Moon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Dark Mode</p>
                          <p className="text-sm text-muted-foreground">Easier on tired eyes</p>
                        </div>
                      </div>
                      <Switch
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Wearable */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Watch className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Wearable Integration</p>
                          <p className="text-sm text-muted-foreground">
                            {wearableConnected ? "Connected" : "Connect for HRV-based stress detection"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={wearableConnected}
                        onCheckedChange={setWearableConnected}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Export Data */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Download className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Export My Data</p>
                          <p className="text-sm text-muted-foreground">Download all your data as JSON</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Delete All Data */}
                <Card className="border-destructive/30">
                  <CardContent className="p-4">
                    {showDeleteConfirm ? (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">Are you sure?</p>
                            <p className="text-sm text-muted-foreground">
                              This will permanently delete all check-ins, journal entries, and settings. 
                              This action cannot be undone.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteAll}
                          >
                            Yes, Delete Everything
                          </Button>
                        </div>
                      </div>
                    ) : deleted ? (
                      <div className="flex items-center gap-3 text-success">
                        <Check className="h-5 w-5" />
                        <span>All data deleted successfully</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <Trash2 className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Delete All Data</p>
                            <p className="text-sm text-muted-foreground">Permanently remove everything</p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-12 text-center text-sm text-muted-foreground">
              <p>ReRhythm v1.0</p>
              <p className="mt-1">Privacy-first wellness for healthcare clinicians</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
