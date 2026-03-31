import React from "react";
import { cn } from "@/lib/utils";

interface VerdictBadgeProps {
  verdict: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function VerdictBadge({ verdict, label, className, size = "md" }: VerdictBadgeProps) {
  const v = verdict.toLowerCase();
  
  let colors = "bg-muted text-muted-foreground border-border";
  
  if (v === "excellent" || v === "pass" || v === "strong" || v === "high") {
    colors = "bg-primary/15 text-primary border-primary/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]";
  } else if (v === "good") {
    colors = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  } else if (v === "fair" || v === "warn" || v === "moderate" || v === "medium") {
    colors = "bg-warning/15 text-warning border-warning/30";
  } else if (v === "weak" || v === "low") {
    colors = "bg-orange-500/15 text-orange-400 border-orange-500/30";
  } else if (v === "insufficient" || v === "fail" || v === "absent") {
    colors = "bg-destructive/15 text-destructive border-destructive/30";
  }

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border uppercase tracking-wider",
        colors,
        sizes[size],
        className
      )}
    >
      {label || verdict}
    </span>
  );
}

export function StatusDot({ status }: { status?: string | null }) {
  const v = (status || "").toLowerCase();
  
  let color = "bg-muted-foreground";
  if (v === "pass" || v === "strong" || v === "high") color = "bg-primary shadow-[0_0_5px_var(--color-primary)]";
  else if (v === "warn" || v === "moderate" || v === "medium") color = "bg-warning";
  else if (v === "fail" || v === "weak" || v === "low" || v === "absent" || v === "error") color = "bg-destructive";

  return <span className={cn("inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1", color)} />;
}
