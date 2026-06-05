import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Zap, Eye, EyeOff, AlertTriangle, CheckCircle2, X, ArrowRight, ArrowLeft, LogIn } from "lucide-react";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import LightRays from "@/components/ui/LightRays";

// tRPC client is typed as AnyRouter; cast once to avoid repeated `as any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typedTrpc = trpc as any;

const PASSWORD_RULES = [
  { test: (pw: string) => pw.length >= 8, label: "Mínimo 8 caracteres" },
  { test: (pw: string) => /[A-Z]/.test(pw), label: "Una letra mayúscula" },
  { test: (pw: string) => /\d/.test(pw), label: "Un numero" },
  { test: (pw: string) => /[!@#$%^&*]/.test(pw), label: "Un carácter especial (!@#$%^&*)" },
];

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Mínimo 8 caracteres";
  if (pw.length > 128) return "Máximo 128 caracteres";
  if (!/[A-Z]/.test(pw)) return "Debe tener al menos una mayúscula";
  if (!/\d/.test(pw)) return "Debe tener al menos un numero";
  if (!/[!@#$%^&*]/.test(pw)) return "Debe tener un carácter especial (!@#$%^&*)";
  return null;
}

const STEPS = ["Datos", "Verificar"];

function getStepBadgeClass(i: number, currentStep: number): string {
  if (i < currentStep) return "bg-primary text-primary-foreground";
  if (i === currentStep) return "bg-primary/30 text-primary";
  return "bg-muted text-muted-foreground";
}

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<0 | 1>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const registerMutation = typedTrpc.auth.register.useMutation({
    onSuccess: (data: { message: string }) => {
      setMessage(data.message);
      setStep(1);
      setError("");
    },
    onError: (err: { message: string }) => setError(err.message),
  });

  const verifyMutation = typedTrpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setLocation("/login");
    },
    onError: (err: { message: string }) => setError(err.message),
  });

  const handleRegister = (e: React.FormEvent) => {
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

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    registerMutation.mutate({ email: email.trim(), password });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (codigo.length !== 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }
    verifyMutation.mutate({ email: email.trim(), codigo });
  };

  const handleKeyDetect = (e: React.KeyboardEvent) => {
    setCapsLock(e.getModifierState("CapsLock"));
  };

  const allPasswordRulesPass = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

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
            Crear cuenta
          </h1>
          <p className="text-xs text-muted-foreground font-medium tracking-wide mt-1">
            BOT Urgentes
          </p>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-wide transition-colors ${
                i <= step
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-muted/30 text-muted-foreground border border-border/30"
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${getStepBadgeClass(i, step)}`}>
                  {i < step ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px ${i < step ? "bg-primary/50" : "bg-border/50"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
          <CardContent className="pt-6">
            {step === 0 ? (
              <form onSubmit={handleRegister} className="space-y-4">
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
                    maxLength={255}
                    autoComplete="email"
                    autoFocus
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Contrasena
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      onKeyDown={handleKeyDetect}
                      onKeyUp={handleKeyDetect}
                      placeholder="Min. 8 caracteres"
                      className="h-11 pr-11 bg-background/50 border-border/50 focus:border-primary/50"
                      autoComplete="new-password"
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
                    <p className="text-[11px] text-amber-700 dark:text-primary flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Bloq Mayus activado
                    </p>
                  )}
                  {password.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                      {PASSWORD_RULES.map((rule) => {
                        const pass = rule.test(password);
                        return (
                          <p key={rule.label} className={`text-[11px] flex items-center gap-1 ${pass ? "text-green-500" : "text-muted-foreground"}`}>
                            {pass ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                            {rule.label}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Repetir contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      onKeyDown={handleKeyDetect}
                      onKeyUp={handleKeyDetect}
                      placeholder="Repetí tu contraseña"
                      className="h-11 pr-11 bg-background/50 border-border/50 focus:border-primary/50"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <X className="h-3 w-3 shrink-0" />
                      Las contraseñas no coinciden
                    </p>
                  )}
                  {passwordsMatch && (
                    <p className="text-[11px] text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      Las contraseñas coinciden
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
                  disabled={registerMutation.isPending || !allPasswordRulesPass || !passwordsMatch}
                >
                  {registerMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Registrando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Continuar
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">
                {message && (
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">{message}</p>
                )}

                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center block">
                    Código de verificación
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={codigo}
                      onChange={(val) => { setCodigo(val); setError(""); }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-12 w-12 text-lg font-bold bg-background/50 border-border/50" />
                        <InputOTPSlot index={1} className="h-12 w-12 text-lg font-bold bg-background/50 border-border/50" />
                        <InputOTPSlot index={2} className="h-12 w-12 text-lg font-bold bg-background/50 border-border/50" />
                      </InputOTPGroup>
                      <span className="text-muted-foreground mx-1">-</span>
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="h-12 w-12 text-lg font-bold bg-background/50 border-border/50" />
                        <InputOTPSlot index={4} className="h-12 w-12 text-lg font-bold bg-background/50 border-border/50" />
                        <InputOTPSlot index={5} className="h-12 w-12 text-lg font-bold bg-background/50 border-border/50" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
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
                  disabled={codigo.length !== 6 || verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Verificando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Verificar email
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep(0); setError(""); setCodigo(""); }}
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 font-medium tracking-wide cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Volver atrás
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Bottom link */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <button
            onClick={() => setLocation("/login")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-medium tracking-wide cursor-pointer"
          >
            <LogIn className="h-3 w-3" />
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
