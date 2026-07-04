import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "gold" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-pill text-white hover:bg-ink",
  gold: "bg-gold text-white hover:bg-amber-600",
  ghost: "bg-transparent text-ink hover:bg-primary-soft",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}

// Bouton d'action circulaire (icône seule) — pattern "+" de la charte
export function IconButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
