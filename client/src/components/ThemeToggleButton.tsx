import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const sizes = {
  sm: { button: "h-8 w-8", icon: "h-3.5 w-3.5" },
  md: { button: "h-10 w-10", icon: "h-4 w-4" },
};

export function ThemeToggleButton({ size = "sm", className = "" }: { size?: "sm" | "md"; className?: string }) {
  const { theme, toggleTheme } = useTheme();
  if (!toggleTheme) return null;

  const s = sizes[size];
  return (
    <button
      onClick={toggleTheme}
      className={`${s.button} shrink-0 rounded-lg border border-border/50 flex items-center justify-center hover:bg-accent transition-colors cursor-pointer ${className}`}
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? (
        <Sun className={`${s.icon} text-muted-foreground`} />
      ) : (
        <Moon className={`${s.icon} text-muted-foreground`} />
      )}
    </button>
  );
}
