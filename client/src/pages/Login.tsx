import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { setAuthToken } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Eye, EyeOff, AlertTriangle, ArrowRight, UserPlus, KeyRound } from "lucide-react";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import LightRays from "@/components/ui/LightRays";

// tRPC client is typed as AnyRouter; cast once to avoid repeated `as any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typedTrpc = trpc as any;

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");

  const utils = typedTrpc.useUtils();

  const loginMutation = typedTrpc.auth.login.useMutation({
    onSuccess: async (data: { token: string }) => {
      setAuthToken(data.token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (utils as any).auth.me.invalidate();
      setLocation("/");
    },
    onError: (err: { message: string }) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Ingresa tu email.");
      return;
    }
     
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError("El email no tiene un formato valido.");
      return;
    }
    if (!password) {
      setError("Ingresa tu contraseña.");
      return;
    }

    loginMutation.mutate({ email: email.trim(), password });
  };

  const handleKeyDetect = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState("CapsLock"));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <ThemeToggleButton size="md" className="absolute top-4 right-4 z-20 bg-card/80 backdrop-blur-sm" />
      {/* LightRays background */}
      <div className="absolute inset-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#e5a50a"
          raysSpeed={1}
          lightSpread={1}
          rayLength={2}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
          followMouse
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
        />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(255,218,49,0.25)] mb-5">
            <Zap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            BOT Urgentes
          </h1>
          <p className="text-xs text-muted-foreground font-medium tracking-wide mt-1">
            Panel de Control
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  autoFocus
                  className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDetect}
                    onKeyUp={handleKeyDetect}
                    placeholder="Tu contraseña"
                    className="h-11 pr-11 bg-background/50 border-border/50 focus:border-primary/50"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {capsLock && (
                  <p className="text-[11px] text-amber-700 dark:text-primary flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Bloq Mayus activado
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                  <p className="text-[12px] text-destructive font-medium text-center">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold cursor-pointer"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Ingresando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Iniciar sesión
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bottom links */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <button
            onClick={() => setLocation("/forgot-password")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-medium tracking-wide cursor-pointer"
          >
            <KeyRound className="h-3 w-3" />
            Olvidé mi contraseña
          </button>
          <div className="h-px w-12 bg-border/50" />
          <button
            onClick={() => setLocation("/registro")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-medium tracking-wide cursor-pointer"
          >
            <UserPlus className="h-3 w-3" />
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
