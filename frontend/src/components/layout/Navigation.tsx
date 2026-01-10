import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart,
  Shield,
  Menu,
  X,
  Home,
  Activity,
  BookOpen,
  Settings,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/check-in", label: "Check-in", icon: Activity },
  { path: "/interventions", label: "Support", icon: Heart },
  { path: "/journal", label: "Journal", icon: BookOpen },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full group-hover:bg-primary/50 transition-colors" />
              <Heart className="relative h-7 w-7 text-primary" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              ReRhythm
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "gap-2 text-muted-foreground hover:text-foreground",
                      isActive && "bg-accent text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Privacy Badge & Settings */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user?.is_anonymous && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <Shield className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-success font-medium">
                  Private Mode
                </span>
              </div>
            )}
            {isAuthenticated ? (
              <>
                <Link to="/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" onClick={logout}>
                  {user?.is_anonymous ? "Delete Session" : "Logout"}
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button>Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 text-muted-foreground",
                      isActive && "bg-accent text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                {isAuthenticated && user?.is_anonymous && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                    <Shield className="h-3.5 w-3.5 text-success" />
                    <span className="text-xs text-success font-medium">
                      Private Mode
                    </span>
                  </div>
                )}
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Link to="/settings" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => { logout(); setIsOpen(false); }}>
                      {user?.is_anonymous ? "Delete Session" : "Logout"}
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button size="sm">Login</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
