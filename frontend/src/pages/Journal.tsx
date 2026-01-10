import { useState, useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Navigation } from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  Clock, 
  Trash2, 
  Plus,
  Timer,
  Check,
  AlertTriangle,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  journalCreate, 
  journalHistory, 
  journalDelete,
  counselingStart,
  counselingFollowup,
  type JournalEntry as ApiJournalEntry 
} from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

type RetentionPeriod = "7_days" | "30_days" | "delete_manually";

interface JournalEntry extends ApiJournalEntry {
  // We'll augment the API type if needed, but it seems sufficient:
  // { id: number; date: string; journal: string; expires_at?: string | null }
}

const retentionOptions: { value: RetentionPeriod; label: string; description: string }[] = [
  { value: "7_days", label: "7 days", description: "Auto-deletes in a week" },
  { value: "30_days", label: "30 days", description: "Auto-deletes in a month" },
  { value: "delete_manually", label: "Keep", description: "Delete manually when ready" },
];

type ChatCodeBlockProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
  node?: unknown;
};

const ChatCodeBlock = ({ node: _node, inline, className, children, ...props }: ChatCodeBlockProps) => (
  <code
    {...props}
    className={cn(className, inline ? undefined : "block mt-2 rounded-md bg-background/40 px-3 py-2")}
  >
    {children}
  </code>
);

const chatMarkdownComponents: Components = {
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
  code: ChatCodeBlock,
};

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newEntry, setNewEntry] = useState("");
  const [retention, setRetention] = useState<RetentionPeriod>("7_days");
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [phiWarning, setPhiWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.user_id) {
      loadEntries();
    }
  }, [user?.user_id]);
  
  // Auto-scroll chat
  useEffect(() => {
    if (isChatOpen && scrollAreaRef.current) {
        // Simple timeout to allow DOM to update
        setTimeout(() => {
            const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }, 100);
    }
  }, [chatMessages, isChatOpen]);


  const loadEntries = async () => {
    if (!user?.user_id) return;
    try {
      setIsLoading(true);
      const history = await journalHistory(user.user_id);
      // Sort by date descending (newest first)
      const sorted = [...history].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEntries(sorted);
    } catch (error) {
       console.error("Failed to load journal properties:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load journal entries.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simple PHI detection
  const detectPHI = (text: string): boolean => {
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{10}\b/, // Phone
      /\bMRN\s*[:.]?\s*\d+/i, // MRN
      /\bDOB\s*[:.]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i, // DOB
      /\bbed\s+\d+/i, // Bed number
      /\broom\s+\d+/i, // Room number
    ];
    return phiPatterns.some((pattern) => pattern.test(text));
  };

  const handleContentChange = (value: string) => {
    setNewEntry(value);
    setPhiWarning(detectPHI(value));
  };

  const handleSave = async () => {
    if (!newEntry.trim() || !user?.user_id) return;

    try {
      setIsSaving(true);
      await journalCreate({
        user_id: user.user_id,
        journal_description: newEntry,
        expiration_type: retention
      });

      setNewEntry("");
      setShowNewEntry(false);
      setPhiWarning(false);
      toast({
        title: "Entry Saved",
        description: "Your journal entry has been saved securely.",
      });
      
      // Reload entries
      await loadEntries();

    } catch (error) {
      console.error("Failed to save entry:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save journal entry. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await journalDelete(id);
      setEntries(entries.filter((e) => e.id !== id));
      toast({
        title: "Deleted",
        description: "Journal entry deleted.",
      });
    } catch (error) {
      console.error("Failed to delete entry:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete entry.",
      });
    }
  };

  // Chat handlers
  const toggleChat = (open: boolean) => {
    setIsChatOpen(open);
    if (open && chatMessages.length === 0 && !conversationId) {
        startChat();
    }
  };

  const startChat = async () => {
      if (!user?.user_id) return;
      try {
          setIsChatLoading(true);
          const res = await counselingStart({ user_id: user.user_id });
          setConversationId(res.conversation_id);
          setChatMessages([{ role: 'assistant', content: res.counseling }]);
      } catch (e: any) {
          console.error("Failed to start chat", e);
          const msg = e.message || "Failed to start support chat.";
          if (msg.includes("No journal entries")) {
              setChatMessages([{ role: 'assistant', content: "I see you haven't written any journal entries yet. Please write an entry so I can help you reflect on it." }]);
          } else {
              toast({ variant: "destructive", title: "Error", description: "Failed to start support chat." });
          }
      } finally {
          setIsChatLoading(false);
      }
  };

  const sendChatMessage = async () => {
      if (!chatInput.trim() || !conversationId) return;
      const userMsg = chatInput;
      setChatInput("");
      setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      
      try {
          setIsChatLoading(true);
          const res = await counselingFollowup({ conversation_id: conversationId, message: userMsg });
          setChatMessages(prev => [...prev, { role: 'assistant', content: res.counseling }]);
      } catch (e) {
            console.error(e);
             toast({ variant: "destructive", title: "Error", description: "Failed to send message." });
      } finally {
          setIsChatLoading(false);
      }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendChatMessage();
      }
  }


  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
                  Private Journal
                </h1>
                <p className="text-muted-foreground">
                  Ephemeral by default. Write freely, entries auto-delete.
                </p>
              </div>
               <Sheet open={isChatOpen} onOpenChange={toggleChat}>
                <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Ask Support
                    </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col h-full sm:max-w-md w-full">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Support Companion
                        </SheetTitle>
                        <SheetDescription>
                            I'm here to help you reflect on your thoughts. Everything we discuss matches your privacy settings.
                        </SheetDescription>
                    </SheetHeader>
                    
                    <div className="flex-1 flex flex-col gap-4 mt-6 overflow-hidden">
                        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                            <div className="space-y-4 pb-4">
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                        {msg.role === 'assistant' && (
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Bot className="h-4 w-4 text-primary" />
                                            </div>
                                        )}
                                        <div className={cn(
                                              "rounded-lg px-4 py-2 max-w-[80%] text-sm font-readable shadow-soft",
                                              msg.role === 'user' 
                                                ? "bg-primary/95 text-primary-foreground"
                                                : "bg-muted text-foreground"
                                            )}>
                                              <ReactMarkdown
                                                className="chat-markdown"
                                                remarkPlugins={[remarkGfm]}
                                                components={chatMarkdownComponents}
                                              >
                                                {msg.content}
                                              </ReactMarkdown>
                                            </div>
                                         {msg.role === 'user' && (
                                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-secondary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex gap-3 justify-start">
                                         <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1">
                                            <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        
                        <div className="flex gap-2 pt-2 border-t mt-auto">
                            <Input 
                                placeholder="Type a message..." 
                                value={chatInput} 
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isChatLoading || (chatMessages.length === 0 && !isChatLoading && !conversationId)}
                            />
                            <Button 
                                size="icon" 
                                onClick={sendChatMessage} 
                                disabled={!chatInput.trim() || isChatLoading}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Privacy Notice */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-success/5 border border-success/20 mb-8">
              <Shield className="h-4 w-4 text-success shrink-0" />
              <p className="text-sm text-success-foreground/80">
                Encrypted & Secure. PHI auto-detection active. You control retention & deletion.
              </p>
            </div>

            {/* New Entry */}
            {showNewEntry ? (
              <Card variant="glow" className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader>
                  <CardTitle className="text-lg">What's on your mind?</CardTitle>
                  <CardDescription>
                    Write freely. This is for you, not for anyone else.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea
                      placeholder="Start writing..."
                      value={newEntry}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="min-h-[150px] resize-none bg-background/50"
                    />
                    {phiWarning && (
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 px-3 py-2 rounded bg-warning/20 border border-warning/30">
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                        <p className="text-xs text-warning">
                          Possible patient identifier detected. Consider removing before saving.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Retention Selection */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Auto-delete after:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {retentionOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setRetention(option.value)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            retention === option.value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <p className="text-sm font-medium text-foreground">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex gap-3 pt-2">
                     <Button 
                      variant="ghost" 
                      onClick={() => setShowNewEntry(false)}
                      className="flex-1"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="glow" 
                      className="flex-[2]" 
                      onClick={handleSave}
                      disabled={isSaving || !newEntry.trim()}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Entry
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="glow" // Changed to glow to make it prominent
                className="w-full mb-8 h-12 text-md"
                onClick={() => setShowNewEntry(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Write New Entry
              </Button>
            )}

            {/* Entries List */}
            {isLoading ? (
               <div className="flex justify-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
               </div>
            ) : entries.length === 0 && !showNewEntry ? (
              <Card variant="default" className="text-center py-12 border-dashed">
                <p className="text-muted-foreground mb-4">No journal entries yet.</p>
                <Button variant="secondary" onClick={() => setShowNewEntry(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Write Your First Entry
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <Card key={entry.id} variant="default" className="group hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(entry.date)} at {formatTime(entry.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.expires_at && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                              <Timer className="h-3 w-3" />
                              Expires {formatDate(entry.expires_at)}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">{entry.journal}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
