import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAnonymousLoading, setIsAnonymousLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [error, setError] = useState("");

  // Register dialog state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRepeatPassword, setRegisterRepeatPassword] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/check-in");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error(err);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsAnonymousLoading(true);
    setError("");
    try {
      await login();
      navigate("/check-in");
    } catch (err) {
      setError("Anonymous login failed.");
      console.error(err);
    } finally {
      setIsAnonymousLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisterLoading(true);
    setRegisterError("");
    
    // Client-side validation
    if (registerPassword !== registerRepeatPassword) {
      setRegisterError("Passwords do not match");
      setIsRegisterLoading(false);
      return;
    }
    
    if (registerPassword.length < 6) {
      setRegisterError("Password must be at least 6 characters long");
      setIsRegisterLoading(false);
      return;
    }
    
    try {
      await register(registerEmail, registerPassword, registerRepeatPassword);
      setIsRegisterOpen(false);
      navigate("/check-in");
    } catch (err: any) {
      setRegisterError(err.message || "Registration failed. Please try again.");
      console.error(err);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12 flex justify-center items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your account or continue anonymously</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoginLoading || isAnonymousLoading}>
                {isLoginLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleAnonymousLogin}
                disabled={isLoginLoading || isAnonymousLoading}
            >
              {isAnonymousLoading ? "Starting..." : "Start Anonymous Session"}
            </Button>

            <div className="mt-4 text-center">
              <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm">
                    Don't have an account? Create one
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Account</DialogTitle>
                    <DialogDescription>
                      Create a new account to save your progress and access your data from any device.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input 
                        id="register-email" 
                        type="email" 
                        placeholder="name@example.com" 
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input 
                        id="register-password" 
                        type="password" 
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-repeat-password">Repeat Password</Label>
                      <Input 
                        id="register-repeat-password" 
                        type="password" 
                        value={registerRepeatPassword}
                        onChange={(e) => setRegisterRepeatPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    {registerError && <p className="text-sm text-red-500">{registerError}</p>}
                    <Button type="submit" className="w-full" disabled={isRegisterLoading}>
                      {isRegisterLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
